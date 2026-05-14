export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  ssr: true,

  css: ['~/assets/styles/main.scss', '~/assets/styles/nuxt-ui.css'],
  modules: ['nuxt-auth-utils', '@pinia/nuxt', '@nuxt/ui'],
  ui: { fonts: false }, // disable the @nuxt/fonts module.
  icon: {
    serverBundle: {
      collections: ['lucide'],
    },
    provider: 'iconify',
  },

  // Prerendering configuration
  routeRules: {
    '/': {
      prerender: true,
      swr: 300,
    },
    '/create-variant': {
      isr: false,
    },
  },

  devServer: {
    port: 3003,
  },

  components: [
    {
      path: '~/components/',
      pattern: '**/*.vue',
      prefix: '',
    },
    {
      path: '~/components/ui',
      pattern: '**/*.vue',
      prefix: '',
    },
  ],

  runtimeConfig: {
    // Server-only runtime config
    apiBackendUrl:
      process.env.NUXT_API_BACKEND_URL || 'http://localhost:8000/api',
    public: {
      apiUrl: process.env.NUXT_LOCAL_DEVELOPMENT
        ? 'http://localhost:8000/api'
        : process.env.NUXT_PUBLIC_API_BASE || '/api',
      localMode: process.env.NUXT_LOCAL_DEVELOPMENT === 'true',
    },
    session: {
      password:
        process.env.NUXT_SESSION_PASSWORD || 'dev-secret-at-least-32-chars',
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
        url: process.env.NITRO_STORAGE_CACHE || 'redis://redis-cache:6379/0',
      },
    },
  },

  vite: {
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit', 'pinia'],
    },
  },
});
