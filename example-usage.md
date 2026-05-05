# Example of correct useFetch usage in Nuxt 4

To ensure that the application works correctly in both local development and Docker (with SSR and prerendering), use the following pattern:

```vue
<script setup lang="ts">
// 1. Get the public API base from runtime config
const config = useRuntimeConfig();

// 2. Use useFetch with a relative path
// Nuxt will automatically handle:
// - During SSR/Prerendering: Prepending NUXT_API_BACKEND_BASE
// - On Client: Prepending NUXT_PUBLIC_API_BASE (/api)
const { data, pending, error } = await useFetch('/variants-count', {
  // We use the shared base path
  baseURL: config.public.apiBase,
  
  // Ensure it runs on the server for SSR/Prerendering
  server: true,
});
</script>

<template>
  <div>
    <h1>Variants Count</h1>
    <p v-if="pending">Loading...</p>
    <p v-else-if="error">Error: {{ error.message }}</p>
    <p v-else>Total variants: {{ data }}</p>
  </div>
</template>
```

### Why this works:
1. **Local Dev**: `apiBase` is `/api`. Nitro `devProxy` in `nuxt.config.ts` catches `/api/**` and sends it to `localhost:8000`.
2. **Prerendering**: Nuxt uses `NUXT_API_BACKEND_BASE` (set to `http://backend:8000` in Docker or `http://localhost:8000` locally) to fetch data directly from the backend.
3. **Client-side**: The browser makes requests to `/api/**`, which Nginx (in Docker) or the dev server (locally) proxies to the backend.
