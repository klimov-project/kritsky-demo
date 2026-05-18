export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const backendUrl =
    import.meta.server && !import.meta.dev ? config.apiBackendUrl : '/api/v1';

  try {
    const session = await getUserSession(event);

    if (!session?.user || !session?.accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }

    const body = await readBody(event);

    // Proxy update profile request to backend
    const response = await fetch(`${backendUrl}/auth/profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw createError({
        statusCode: response.status,
        statusMessage: error.detail || 'Profile update failed',
      });
    }

    const data = await response.json();

    // Update session with new user data
    await setUserSession(event, {
      user: data,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });

    return data;
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
});
