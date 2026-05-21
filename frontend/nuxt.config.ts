export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  ssr: true,

  css: ['~/assets/styles/main.scss', '~/assets/styles/nuxt-ui.css'],
  modules: ['@pinia/nuxt', '@nuxt/ui'],
  ui: { fonts: false },
  icon: {
    serverBundle: {
      collections: ['lucide'],
    },
    provider: 'iconify',
  },
  // Отключаем автоматическую загрузку иконок
  // icon: false,

  // Отключаем client bundle чтобы не тащить лишнее

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
    apiBackendBase:
      process.env.NUXT_API_BACKEND_BASE || 'http://localhost:8000/api',
    apiBackendUrl:
      process.env.NUXT_API_BACKEND_URL || 'http://localhost:8000/api/v1',
    // YooKassa credentials (server-only)
    yookassaShopId: process.env.YOOKASSA_SHOP_ID || '',
    yookassaSecretKey: process.env.YOOKASSA_SECRET_KEY || '',

    public: {
      // Client-side: requests go directly to backend
      apiUrl: process.env.NUXT_PUBLIC_BACKEND_API_URL || '/api/v1',
      // Client-side: nitro routes
      nitroApiUrl: process.env.NUXT_PUBLIC_NITRO_API_URL || '/api',
      localMode: process.env.NUXT_LOCAL_DEVELOPMENT === 'true',
    },
    sessionPassword: process.env.NUXT_SESSION_PASSWORD,
  },

  nitro: {
    // devProxy: {
    //   '/api': {
    //     target:
    //       process.env.NUXT_API_BACKEND_BASE || 'http://localhost:8000/api',
    //     changeOrigin: true,
    //   },
    // },
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
      exclude: ['html2canvas', 'jspdf'],
    },
    build: {
      rollupOptions: {
        external: ['html2canvas', 'jspdf'],
      },
    },
  },
});
