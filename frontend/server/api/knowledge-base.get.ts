export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const cacheKey = 'cache:knowledge-base';
  
  // Try to get from storage
  const cached = await useStorage().getItem(cacheKey);
  if (cached) {
    console.log('Serving knowledge-base from cache');
    return cached;
  }

  try {
    console.log('Fetching knowledge-base from backend');
    const response = await $fetch('/api/knowledge-base', {
      baseURL: config.apiBackendBase,
    });
    
    // Store in cache with 1 hour TTL
    await useStorage().setItem(cacheKey, response, { ttl: 3600 });
    
    return response;
  } catch (error) {
    console.error('Failed to fetch knowledge-base:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch knowledge-base from backend',
    });
  }
});
