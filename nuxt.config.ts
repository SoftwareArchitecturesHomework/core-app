// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['./app/assets/css/main.css'],
  modules: ['@nuxt/ui', '@sidebase/nuxt-auth'],

  imports: {},
  vite: {
    plugins: [],
  },

  fonts: {
    google: false,
    googleicons: false,
    bunny: false,
    fontshare: false,
    fontsource: false,

    provider: 'local',
  },
  vuetify: {
    moduleOptions: {
      prefixComposables: true,
    },
    vuetifyOptions: {},
  },

  typescript: {
    tsConfig: {
      compilerOptions: {
        types: [
          "node",
          "next-auth",
          "@sidebase/nuxt-auth"
        ],
        typeRoots: [
          "./types",
          "./node_modules/@types"
        ]
      },
      include: [
        "types/**/*.d.ts"
      ]
    }
  },

  runtimeConfig: {
    auth: {
      origin: process.env.AUTH_ORIGIN || 'http://localhost:3000',
      baseUrl: '/api/auth',
    },
  },

  auth: {
    provider: {
      type: 'authjs'
    },

    // app origin
    origin: 'http://localhost:3000',

    // MUST be only the path
    baseURL: '/api/auth',

    globalAppMiddleware: false,

    // these are fine to keep
    disableInternalRouting: true,
    disableServerSideAuth: true,
  },
})