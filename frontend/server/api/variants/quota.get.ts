interface QuotaResponse {
  generatedVariants: number;
  maxVariants: number;
  generationsRemaining: number;
  maxGenerations: number;
  isPro: boolean;
}

export default defineEventHandler(async (event) => {
  try {
    // Get the session to verify authentication
    const session = await getUserSession(event);

    const config = useRuntimeConfig();
    const backendUrl = `${config.apiBackendBase}/api`;

    // Forward quota request to backend with auth token
    const response = await fetch(`${backendUrl}/variants/export/quota`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      // Return default quota for free users
      return {
        generatedVariants: 0,
        maxVariants: 10,
        generationsRemaining: 3,
        maxGenerations: 10,
        isPro: false,
      } as QuotaResponse;
    }

    const result = (await response.json()) as QuotaResponse;
    return result;
  } catch (error) {
    console.error('[v0] Fetch quota error:', error);
    // Return default quota as fallback
    return {
      generatedVariants: 0,
      maxVariants: 10,
      generationsRemaining: 3,
      maxGenerations: 10,
      isPro: false,
    } as QuotaResponse;
  }
});
