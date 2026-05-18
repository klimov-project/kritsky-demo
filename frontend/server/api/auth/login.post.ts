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
      headers: { 'Content-Type': 'application/json' },
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

    await setUserSession(event, {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || data.user.first_name,
        phone: data.user.phone,
        role: data.user.role || 'user',
        isPro: data.user.is_pro || data.user.isPro || false,
        isBlocked: data.user.is_blocked || data.user.isBlocked || false,
      },
      accessToken: data.accessToken || data.access_token,
      refreshToken: data.refreshToken || data.refresh_token,
      loggedInAt: new Date().toISOString(),
    });

    const session = await getUserSession(event);
    if (session) {
      // Verify session was set correctly
      setCookie(event, 'auth.session', session.id || session._id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

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
