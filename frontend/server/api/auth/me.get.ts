export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

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
      const response = await fetch(`${config.apiBackendUrl}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

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
