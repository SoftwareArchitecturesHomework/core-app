import { NuxtAuthHandler } from '#auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import bcrypt from 'bcrypt'
import _CredentialsProvider from 'next-auth/providers/credentials'
import _DiscordProvider from 'next-auth/providers/discord'
import _GoogleProvider from 'next-auth/providers/google'
import type { User } from '~~/.generated/prisma/client'
import '~~/types/next-auth.d'

const GoogleProvider = (_GoogleProvider as any)
  .default as typeof _GoogleProvider
const DiscordProvider = (_DiscordProvider as any)
  .default as typeof _DiscordProvider
const CredentialsProvider = (_CredentialsProvider as any)
  .default as typeof _CredentialsProvider

const config = useRuntimeConfig()
export default NuxtAuthHandler({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
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
    DiscordProvider({
      clientId: config.discordClientId,
      clientSecret: config.discordClientSecret,
      authorization: {
        params: {
          scope: 'identify email guilds',
        },
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        )

        if (!isValid) {
          return null
        }

        return {
          id: user.id as unknown as string, // next-auth expects string id but our prisma schema uses Int
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        }
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

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },

    async signIn({ user, account, profile }) {
      console.log(user, account, profile)

      if (!account) {
        return '/login?notify=' + encodeURI('No account information available')
      }
      if (account.provider === 'credentials') return true

      // Account linking logic
      const email = user?.email as string | undefined
      if (!email) return true
      const name = user?.name as string | undefined
      const image = user?.image as string | undefined

      try {
        const existingUser = await prisma.user.findUnique({
          where: { email },
        })

        if (!existingUser) {
          if (account.provider === config.primaryLoginProvider) {
            return true
          }

          return (
            `/login?notify=` +
            encodeURI(
              `You must first sign in with ${config.primaryLoginProvider} to link your ${account.provider} account.`,
            )
          )
        }

        const existingAccount = await prisma.account.findFirst({
          where: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        })

        if (!existingAccount) {
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token ?? undefined,
              access_token: account.access_token ?? undefined,
              expires_at: account.expires_at ?? undefined,
              token_type: account.token_type ?? undefined,
              scope: account.scope ?? undefined,
              id_token: account.id_token ?? undefined,
              session_state: account.session_state ?? undefined,
            },
          })
        }

        // Fill in missing user data
        const updateData: Partial<User> = {}
        if (!existingUser.name && name) updateData.name = name
        if (!existingUser.image && image) updateData.image = image
        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: updateData,
          })
        }
      } catch (err) {
        console.error('signIn callback error:', err)
      }

      return true
    },

    async session({ session, token }) {
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
