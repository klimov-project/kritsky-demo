/**
 * Login endpoint using nuxt-auth-utils
 *
 * Proxies login request to backend, then stores user in sealed session cookie
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const backendUrl =
    import.meta.server && !import.meta.dev
      ? `${config.apiBackendBase}/api`
      : config.apiBackendUrl;

  console.log('[Login endpoint] Start', {
    timestamp: new Date().toISOString(),
    backendUrl,
  });

  try {
    const body = await readBody(event);
    console.log('[Login endpoint] Request body:', {
      email: body.email,
      passwordPresent: !!body.password,
    });

    // Proxy login request to backend
    const loginUrl = `${backendUrl}/auth/login`;
    console.log('[Login endpoint] Proxying to backend:', loginUrl);

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[Login endpoint] Backend response status:', response.status);
    console.log('[Login endpoint] Response headers:', {
      'content-type': response.headers.get('content-type'),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Login endpoint] Backend error response:', errorText);

      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = { detail: errorText };
      }

      throw createError({
        statusCode: response.status,
        statusMessage: errorJson.detail || errorJson.message || 'Login failed',
      });
    }

    const data = await response.json();
    console.log('[Login endpoint] Backend response data structure:', {
      hasUser: !!data.user,
      userKeys: data.user ? Object.keys(data.user) : [],
      hasAccessToken: !!(data.accessToken || data.access_token),
      hasRefreshToken: !!(data.refreshToken || data.refresh_token),
      tokenType: data.accessToken
        ? 'accessToken'
        : data.access_token
        ? 'access_token'
        : 'none',
    });

    // Prepare user object
    const userData = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name || data.user.first_name,
      phone: data.user.phone,
      role: data.user.role || 'user',
      isPro: data.user.is_pro || data.user.isPro || false,
      isBlocked: data.user.is_blocked || data.user.isBlocked || false,
    };
    console.log('[Login endpoint] User object to store:', userData);

    // Set user session using nuxt-auth-utils
    console.log('[Login endpoint] Setting user session...');

    const sessionData = {
      user: userData,
      accessToken: data.accessToken || data.access_token,
      refreshToken: data.refreshToken || data.refresh_token,
      loggedInAt: new Date().toISOString(),
    };

    await setUserSession(event, sessionData);

    // Verify session was set
    const sessionCheck = await getUserSession(event);
    console.log('[Login endpoint] Session verification after set:', {
      hasUser: !!sessionCheck.user,
      userId: sessionCheck.user?.id,
      hasAccessToken: !!sessionCheck.accessToken,
      loggedInAt: sessionCheck.loggedInAt,
    });

    // Check cookies that were set
    const cookies =
      getCookie(event, 'auth.session') || getCookie(event, 'nuxt-auth-session');
    console.log('[Login endpoint] Session cookie set:', {
      cookieName: cookies ? 'auth.session or nuxt-auth-session' : 'none',
      cookieLength: cookies ? cookies.length : 0,
      cookiePreview: cookies ? `${cookies.substring(0, 50)}...` : 'none',
    });

    console.log('[Login endpoint] Login successful, returning response');

    return {
      user: data.user,
      success: true,
    };
  } catch (error) {
    console.error('[Login endpoint] Error caught:', {
      name: error?.name,
      message: error?.message,
      statusCode: error?.statusCode,
      statusMessage: error?.statusMessage,
      stack: error?.stack,
    });

    if (error?.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Login failed',
    });
  }
});
