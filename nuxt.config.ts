// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['./app/assets/css/main.css'],
  modules: ['@nuxt/ui', '@sidebase/nuxt-auth', '@vueuse/nuxt'],
  runtimeConfig: {
    primaryLoginProvider: 'google',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    discordClientId: '',
    discordClientSecret: '',
    authSecret: process.env.AUTH_SECRET,
    authOrigin: process.env.NUXT_AUTH_ORIGIN || 'http://localhost:3000',
    authUrl: process.env.AUTH_URL || 'http://localhost:3000',
    commsAPIUrl: '',

    jwtPrivateKey: '',
  },
  app: {
    head: {
      title: 'WorkPlanner',
      link: [{ rel: 'icon', type: 'image/png', href: '/favicon.png' }],
    },
  },

  nitro: {
    routeRules: {
      '/api/**': { cors: true },
    },
  },
  $development: {
    nitro: {
      plugins: ['~~/server/dev-plugins/db-seed'],
    },
    devServer: {
      host: '0.0.0.0',
      port: 3000,
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
