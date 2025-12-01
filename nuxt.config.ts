// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['./app/assets/css/main.css'],
  modules: ['@nuxt/ui', '@sidebase/nuxt-auth', '@vueuse/nuxt'],
  runtimeConfig: {
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authSecret: process.env.AUTH_SECRET || '',
    authOrigin: process.env.AUTH_ORIGIN || '',
    authUrl: process.env.AUTH_URL || '',
    commsAPIUrl: '',

    jwtPrivateKey: '',
  },
  app: {
    head: {
      title: 'WorkPlanner',
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/favicon-light.png',
          media: '(prefers-color-scheme: light)',
        },
        {
          rel: 'icon',
          type: 'image/png',
          href: '/favicon-dark.png',
          media: '(prefers-color-scheme: dark)',
        },
      ],
    },
  },

  $development: {
    nitro: {
      plugins: ['~~/server/dev-plugins/db-seed'],
    },
  },

  fonts: {
    google: false,
    googleicons: false,
    bunny: false,
    fontshare: false,
    fontsource: false,

    provider: 'local',
  },

  typescript: {
    tsConfig: {
      compilerOptions: {
        types: ['node', 'next-auth', '@sidebase/nuxt-auth'],
        typeRoots: ['./types', './node_modules/@types'],
      },
      include: ['types/**/*.d.ts'],
    },
  },

  auth: {
    originEnvKey: 'NUXT_AUTH_ORIGIN',
    provider: {
      type: 'authjs',
      defaultProvider: 'google',
      addDefaultCallbackUrl: true,
    },
    sessionRefresh: {
      enablePeriodically: 60 * 1000, // 1 minute
      enableOnWindowFocus: true,
    },
  },
})
