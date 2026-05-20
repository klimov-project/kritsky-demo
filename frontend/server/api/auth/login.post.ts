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

  try {
    const body = await readBody(event);

    // Proxy login request to backend
    const loginUrl = `${backendUrl}/auth/login`;
    console.log('[Login endpoint] Proxying to backend:', loginUrl);
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = await response.json().catch(() => ({}));
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = { detail: errorText };
      }
      throw createError({
        statusCode: response.status,
        statusMessage:
          errorJson.detail ||
          errorJson.message ||
          error.detail ||
          'Login failed',
      });
    }

    const data = await response.json();

    // Set user session using nuxt-auth-utils
    // The session is encrypted and stored in a sealed cookie
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
      // Store tokens for API calls that need them
      accessToken: data.accessToken || data.access_token,
      refreshToken: data.refreshToken || data.refresh_token,
      loggedInAt: new Date().toISOString(),
    });

    return {
      user: data.user,
      success: true,
    };
  } catch (error) {
    console.error('Login error:', error);
    if (error?.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Login failed',
    });
  }
});
