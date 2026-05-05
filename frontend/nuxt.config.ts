export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,

  // Prerendering configuration
  routeRules: {
    '/': {
      prerender: true,
      swr: 60,
    },
    '/create-variant': {
      prerender: true,
      swr: 300,
    },
    '/api/knowledge-base': {
      swr: 120,
    },
  },

  devServer: {
    port: 3003,
  },
  runtimeConfig: {
    // Server-only runtime config (can be overridden by NUXT_API_BACKEND_BASE)
    apiBackendBase: 'http://localhost:8000',
    public: {
      // Shared public runtime config (can be overridden by NUXT_PUBLIC_API_BASE)
      apiBase: '/api',
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
        driver: 'memory',
      },
    },
  },

  vite: {
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit'],
    },
  },

  modules: ['@nuxtjs/tailwindcss', 'nuxt-auth-utils', '@pinia/nuxt'],
});
