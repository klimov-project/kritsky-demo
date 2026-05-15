export default defineEventHandler(async (event) => {
  try {
    // Get the session to verify authentication
    const { user } = await requireAuth(event)

    const config = useRuntimeConfig()
    const session = await useAuthSession(event)

    // Fetch variants list from backend
    const response = await fetch(`${config.apiBackendUrl}/variants`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized',
        })
      }
      throw createError({
        statusCode: response.status,
        statusMessage: 'Failed to fetch variants',
      })
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('[v0] Fetch variants error:', error)
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch variants',
    })
  }
})
