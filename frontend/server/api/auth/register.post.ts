export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const backendUrl =
    import.meta.server && !import.meta.dev ? config.apiBackendUrl : '/api/v1';

  console.log('[Register endpoint] Start', {
    timestamp: new Date().toISOString(),
    backendUrl: config.apiBackendUrl,
  });
  try {
    const body = await readBody(event);

    console.log(`${backendUrl}/auth/register`, {
      timestamp: new Date().toISOString(),
      backendUrl: config.apiBackendUrl,
    });
    // Proxy register request to backend
    const response = await fetch(`${backendUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw createError({
        statusCode: response.status,
        statusMessage: error.detail || 'Registration failed',
      });
    }

    const data = await response.json();

    // Set session with auth tokens
    await setUserSession(event, {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        phone: data.user.phone,
        role: data.user.role,
        isPro: data.user.isPro,
        isBlocked: data.user.isBlocked,
      },
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    return {
      user: data.user,
      accessToken: data.accessToken,
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
});
