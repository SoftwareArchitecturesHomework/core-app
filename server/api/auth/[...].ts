import { NuxtAuthHandler } from '#auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import _GoogleProvider from 'next-auth/providers/google'
import { prisma } from '~~/server/utils/prisma'
import '~~/types/next-auth.d'

const GoogleProvider = (_GoogleProvider as any)
  .default as typeof _GoogleProvider

const config = useRuntimeConfig()
export default NuxtAuthHandler({
  // @ts-expect-error new prisma version
  // the adapter types are not yet updated
  // but the actual prisma api didn't change
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  secret: config.authSecret,
  providers: [
    GoogleProvider({
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    }),
  ],

  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) {
        return baseUrl + url
      }

      try {
        if (new URL(url).origin === baseUrl) {
          return url
        }
      } catch {}

      return baseUrl
    },

    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id as unknown as number
        session.user.role = user.role
      }
      return session
    },
  },
})
