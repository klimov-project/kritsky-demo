export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const backendUrl =
    import.meta.server && !import.meta.dev
      ? `${config.apiBackendBase}/api`
      : config.apiBackendUrl;

  try {
    // Get session
    const session = await getUserSession(event);

    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }

    // If we have an access token, fetch fresh user data from backend
    if (session.accessToken) {
      const response = await fetch(`${backendUrl}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Handle 401 - clear session and force logout
      if (response.status === 401) {
        await clearUserSession(event);
        throw createError({
          statusCode: 401,
          statusMessage: 'Session expired - please login again',
        });
      }

      if (response.ok) {
        const userData = await response.json();
        return userData;
      }
    }

    // Otherwise return cached user data from session
    return session.user;
  } catch (error) {
    console.error('Me endpoint error:', error);
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }
});
