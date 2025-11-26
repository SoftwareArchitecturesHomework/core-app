
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: [
    './app/assets/css/main.css'],
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

  auth: {
    provider: {
      type: 'authjs',
      trustHosts: true, // This is fine now
      defaultProvider: 'google',
      addDefaultCallbackUrl: true,
    },
    originEnvKey: 'AUTH_ORIGIN',
    baseURL: '/api/auth',

    disableServerSideAuth: false,

    sessionRefresh: {
      enablePeriodically: true,
      enableOnWindowFocus: true,
    }
  },
})