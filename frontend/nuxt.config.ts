export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,
  routeRules: {
    '/': {
      swr: 60,
      prerender: true,
    },
  },
  runtimeConfig: {
    apiBackendBase: process.env.NUXT_API_BACKEND_BASE || 'http://localhost:8000',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
    },
  },
  nitro: {
    storage: {
      cache: {
        driver: 'memory'
      }
    }
  },
  vite: {
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit'],
    },
  },
});
