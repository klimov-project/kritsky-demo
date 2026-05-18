/**
 * Token refresh endpoint
 *
 * Refreshes JWT tokens using the refresh token
 * Updates session with new tokens
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const backendUrl =
    import.meta.server && !import.meta.dev
      ? `${config.apiBackendBase}/api`
      : config.apiBackendUrl;

  try {
    const body = await readBody(event);
    const { refreshToken } = body;

    if (!refreshToken) {
      // Try to get refresh token from session
      const session = await getUserSession(event);
      if (!session?.refreshToken) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Refresh token not provided',
        });
      }
      body.refreshToken = session.refreshToken;
    }

    // Proxy refresh request to backend
    const response = await fetch(`${backendUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: body.refreshToken }),
    });

    if (!response.ok) {
      // Clear session on refresh failure
      await clearUserSession(event);
      throw createError({
        statusCode: response.status,
        statusMessage: 'Token refresh failed',
      });
    }

    const data = await response.json();

    // Update session with new tokens
    const currentSession = await getUserSession(event);
    await setUserSession(event, {
      user: currentSession?.user || data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      loggedInAt: currentSession?.loggedInAt,
    });

    return {
      success: true,
      accessToken: data.accessToken,
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    if ((error as { statusCode?: number }).statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Token refresh failed',
    });
  }
});
