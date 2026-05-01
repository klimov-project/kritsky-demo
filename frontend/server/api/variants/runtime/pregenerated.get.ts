export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const cacheKey = 'cache:pregenerated-variant';
  
  const cached = await useStorage().getItem(cacheKey);
  if (cached) {
    console.log('Serving pregenerated variant from cache');
    return cached;
  }

  try {
    console.log('Fetching pregenerated variant from backend');
    const response = await $fetch('/api/variants/runtime/pregenerated', {
      baseURL: config.apiBackendBase,
    });
    
    await useStorage().setItem(cacheKey, response, { ttl: 3600 });
    
    return response;
  } catch (error) {
    console.error('Failed to fetch pregenerated variant:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch pregenerated variant from backend',
    });
  }
});
