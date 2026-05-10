export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,
  css: ['~/assets/styles/main.scss', '~/assets/styles/nuxt-ui.css'],
  modules: ['nuxt-auth-utils', '@pinia/nuxt', '@nuxt/ui'],

  // Prerendering configuration
  routeRules: {
    '/': {
      prerender: true,
      swr: 35,
      // swr: 300,
    },
    '/api/knowledge-base': {
      swr: 35,
      // swr: 120,
    },
  },

  devServer: {
    port: 3003,
  },
  runtimeConfig: {
    // Server-only runtime config
    apiBackendUrl:
      process.env.NUXT_API_BACKEND_URL || 'http://localhost:8000/api',
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_BASE || '/api',
    },
  },

  // Proxy configuration for local development
  nitro: {
    devProxy: {
      '/api': {
        target:
          process.env.NUXT_API_BACKEND_BASE || 'http://localhost:8000/api',
        changeOrigin: true,
      },
    },
    storage: {
      cache: {
        driver: 'redis',
        host: process.env.REDIS_HOST,
        port: 6379,
        // password: process.env.REDIS_PASSWORD
      },
    },
  },

  vite: {
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit', 'pinia'],
    },
  },
});
