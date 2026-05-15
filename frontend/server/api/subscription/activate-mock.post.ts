interface MockSubscriptionResponse {
  isPro: boolean
  subscriptionExpiresAt: string
  message: string
}

export default defineEventHandler(async (event) => {
  try {
    // Get the session to verify authentication
    const { user } = await requireAuth(event)

    const config = useRuntimeConfig()
    const session = await useAuthSession(event)

    // Forward activate-mock request to backend with auth token
    const response = await fetch(
      `${config.apiBackendUrl}/subscription/activate-mock`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({}),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw createError({
        statusCode: response.status,
        statusMessage: errorData.detail || 'Failed to activate subscription',
      })
    }

    const result = await response.json() as MockSubscriptionResponse
    return result
  } catch (error) {
    console.error('[v0] Activate mock subscription error:', error)
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to activate subscription',
    })
  }
})
