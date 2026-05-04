export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  try {
    const body = await readBody(event);

    // Proxy login request to backend
    const response = await fetch(`${config.apiBackendBase}/auth/login`, {
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
        statusMessage: error.detail || 'Login failed',
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
      loggedInAt: new Date(),
    });

    // Store tokens in session (or in an httpOnly cookie)
    await setUserSession(event, {
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    return {
      user: data.user,
      accessToken: data.accessToken,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
});
