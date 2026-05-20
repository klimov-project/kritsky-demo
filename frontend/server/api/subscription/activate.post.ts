interface MockSubscriptionResponse {
  isPro: boolean;
  subscriptionExpiresAt: string;
  message: string;
}

export default defineEventHandler(async (event) => {
  try {
    // Get the session to verify authentication
    const session = await getUserSession(event);

    const config = useRuntimeConfig();
    const backendUrl = `${config.apiBackendBase}/api`;

    console.log('[Sub ACTIVATE] session token - ', session.accessToken);
    // Forward activate-mock request to backend with auth token
    const response = await fetch(`${backendUrl}/subscription/activate-mock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({}),
    });
    console.log('[Sub ACTIVATE] Response ok? - ', response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw createError({
        statusCode: response.status,
        statusMessage: errorData.detail || 'Failed to activate subscription',
      });
    }

    const result = (await response.json()) as MockSubscriptionResponse;
    return result;
  } catch (error) {
    console.error('[Sub ACTIVATE] Activate mock subscription error:', error);
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to activate subscription',
    });
  }
});
