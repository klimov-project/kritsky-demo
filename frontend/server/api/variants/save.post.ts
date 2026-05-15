import type { GeneratedVariant } from '@/types/generatedVariant'

interface SaveVariantRequest {
  title: string
  description?: string
  variant: GeneratedVariant
}

interface SaveVariantResponse {
  id: string
  title: string
  description?: string
  shareableLink: string
  createdAt: string
  isPro?: boolean
  variantId?: string
}

export default defineEventHandler(async (event) => {
  try {
    // Get the session to verify authentication
    const { user } = await requireAuth(event)

    // Parse request body
    const body = await readBody<SaveVariantRequest>(event)

    // Validate required fields
    if (!body.title || !body.variant) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: title and variant',
      })
    }

    const config = useRuntimeConfig()
    const session = await useAuthSession(event)

    // Forward save request to backend with auth token
    const response = await fetch(`${config.apiBackendUrl}/variants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        title: body.title,
        description: body.description || '',
        variant: body.variant,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw createError({
        statusCode: response.status,
        statusMessage: errorData.detail || 'Failed to save variant',
      })
    }

    const result = await response.json() as SaveVariantResponse
    return result
  } catch (error) {
    console.error('[v0] Save variant error:', error)
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save variant',
    })
  }
})
