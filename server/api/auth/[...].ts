import { NuxtAuthHandler } from '#auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import _GoogleProvider from 'next-auth/providers/google'
import _CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt' // or argon2, or bcryptjs
import '~~/types/next-auth.d'

const GoogleProvider = (_GoogleProvider as any)
  .default as typeof _GoogleProvider
const CredentialsProvider = (_CredentialsProvider as any).default as typeof _CredentialsProvider


const config = useRuntimeConfig()
export default NuxtAuthHandler({
  // @ts-expect-error new prisma version
  // the adapter types are not yet updated
  // but the actual prisma api didn't change
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' }, // Changed to jwt to support credentials
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
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          return null
        }

        return {
          id: String(user.id), // Convert to string
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        }
      }
    })
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
      } catch { }

      return baseUrl
    },

    async jwt({ token, user, account }) {
      // On sign in, add user info to token
      if (user) {
        token.id = user.id
        token.role = user.role
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },

    async session({ session, token }) {
      // Add user info from token to session
      if (session.user && token) {
        session.user.id = Number(token.id) // Convert back to number
        session.user.role = token.role as any
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
    },
  },
})
