const isDev = process.env.NODE_ENV === 'development';

export default defineNuxtConfig({
  app: {
    pageTransition: false,
    layoutTransition: false,
    head: {
      title: 'SLEAF | AUTH',
      htmlAttrs: {
        lang: 'en',
      },
      script: [
        {
          src: 'https://metrics.sleaf.dev/api/script.js',
          'data-site-id': '2',
          defer: true,
        },
      ],
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, height=device-height, initial-scale=1.0, user-scalable=0, minimum-scale=1.0, maximum-scale=1.0',
        },
        { name: 'description', content: '' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: 'https://s3.twcstorage.ru/0af29f8f-sleaf/auth-service/favicon.png' }],
    },
  },
  nitro: {
    compressPublicAssets: true,
  },
  experimental: {
    viewTransition: true,
    renderJsonPayloads: true,
  },
  sourcemap: true,
  compatibilityDate: '2025-01-29',
  devtools: { enabled: true },
  modules: ['@nuxtjs/i18n', '@nuxtjs/device', '@nuxt/icon', '@nuxt/fonts', '@nuxt/image', '@nuxtjs/color-mode'],
  icon: {
    serverBundle: {
      collections: ['pixelarticons'],
    },
  },
  plugins: ['@/plugins/Vue3Marquee.client.ts'],
  i18n: {
    locales: [
      { code: 'en', iso: 'en-US', name: 'English', file: 'en-US.json' },
      { code: 'ru', iso: 'ru-RU', name: 'Русский', file: 'ru-RU.json' },
    ],
    lazy: true,
    langDir: 'locales',
    bundle: {
      optimizeTranslationDirective: false,
    },
    detectBrowserLanguage: {
      useCookie: true,
      fallbackLocale: 'en',
    },
    strategy: 'no_prefix',
    defaultLocale: 'en',
  },
  colorMode: {
    preference: 'system',
    fallback: 'light',
    hid: 'nuxt-color-mode-script',
    globalName: '__NUXT_COLOR_MODE__',
    componentName: 'ColorScheme',
    classPrefix: '',
    classSuffix: '',
    storage: 'localStorage',
    storageKey: 'site-color-mode',
  },
  devServer: {
    port: 4000,
  },
  css: ['@/assets/scss/global.scss', '@/assets/scss/screens.scss'],
  runtimeConfig: {
    public: {
      DATABASE_NAME: process.env.DATABASE_NAME,
      DATABASE_URL: process.env.DATABASE_URL,
      REDIS_URL: process.env.REDIS_URL,
      DOMAIN: process.env.DOMAIN,
      JWT_SECRET: process.env.JWT_SECRET,
      EMAIL_SMTP_SERVER: process.env.EMAIL_SMTP_SERVER,
      EMAIL_SMTP_PORT: process.env.EMAIL_SMTP_PORT,
      EMAIL_SMTP_USERNAME: process.env.EMAIL_SMTP_USERNAME,
      EMAIL_SMTP_PASSWORD: process.env.EMAIL_SMTP_PASSWORD,
      NODE_ENV: process.env.NODE_ENV,
    },
  },
});
