interface ResetMockResponse {
  isPro: boolean;
  subscriptionExpiresAt: string | null;
  message: string;
}

export default defineEventHandler(async (event) => {
  try {
    // Get the session to verify authentication

    const config = useRuntimeConfig();
    const session = await useAuthSession(event);
    const backendUrl = `${config.apiBackendBase}/api`;

    // Forward reset-mock request to backend with auth token
    const response = await fetch(`${backendUrl}/subscription/reset-mock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw createError({
        statusCode: response.status,
        statusMessage: errorData.detail || 'Failed to reset subscription',
      });
    }

    const result = (await response.json()) as ResetMockResponse;
    return result;
  } catch (error) {
    console.error('[v0] Reset mock subscription error:', error);
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to reset subscription',
    });
  }
});
