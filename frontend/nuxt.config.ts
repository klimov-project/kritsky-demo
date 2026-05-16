export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  ssr: true,

  css: ['~/assets/styles/main.scss', '~/assets/styles/nuxt-ui.css'],
  modules: ['nuxt-auth-utils', '@pinia/nuxt', '@nuxt/ui'],
  ui: { fonts: false },
  // icon: {
  //   serverBundle: {
  //     collections: ['lucide'],
  //   },
  //   provider: 'iconify',
  // },
   icon: { // Отключаем провайдера по умолчанию
    provider: 'server',
    
    // Бандлим только нужные иконки локально
    serverBundle: {
      collections: ['lucide'],
      // Это важно — указываем конкретные иконки
      icons: [
        'lucide:search',
        'lucide:menu',
        'lucide:x',
        'lucide:chevron-down',
        'lucide:chevron-right',
        // ... все используемые иконки
      ],
      // Отключаем fallback на внешний API
      fallbackToApi: false,
    },
    
    // Отключаем client bundle чтобы не тащить лишнее
    clientBundle: {
      scan: false,
      icons: [],
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
    // YooKassa credentials (server-only)
    yookassaShopId: process.env.YOOKASSA_SHOP_ID || '',
    yookassaSecretKey: process.env.YOOKASSA_SECRET_KEY || '',
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

  nitro: {
    // Proxy configuration for local development
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
