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

    const sessionData = {
      user: data.user,
      accessToken: data.accessToken || data.access_token,
      refreshToken: data.refreshToken || data.refresh_token,
      loggedInAt: new Date().toISOString(),
    };

    await setUserSession(event, sessionData, {
      // КРИТИЧНО: для IP - никакого domain
      domain: undefined,
      // КРИТИЧНО: false, так как у вас HTTP
      secure: false,
      sameSite: 'lax',
      path: '/',
      httpOnly: true,
    });

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
