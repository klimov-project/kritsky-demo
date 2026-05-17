export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  try {
    const session = await getUserSession(event);

    if (!session?.user || !session?.accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }

    const body = await readBody(event);

    // Proxy change password request to backend
    const response = await fetch(
      `${config.apiBackendBase}/auth/change-password`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw createError({
        statusCode: response.status,
        statusMessage: error.detail || 'Password change failed',
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Password change error:', error);
    throw error;
  }
});
