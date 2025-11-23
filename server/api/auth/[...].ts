import { NuxtAuthHandler } from '#auth'
import GoogleProviderImport from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '../../../lib/prisma'

const GoogleProvider =
    (GoogleProviderImport as any).default ?? GoogleProviderImport

export default NuxtAuthHandler({
    secret: process.env.AUTH_SECRET,

    adapter: PrismaAdapter(prisma),

    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: 'select_account',
                },
            },
        }),
    ],

    session: { strategy: 'database' },

    callbacks: {
        async redirect({ url, baseUrl }) {
            const safeBase =
                baseUrl ||
                process.env.NEXTAUTH_URL ||
                process.env.AUTH_ORIGIN ||
                'http://localhost:3000'

            if (url.startsWith('/')) return safeBase + url

            try {
                if (new URL(url).origin === safeBase) return url
            } catch {
                // ignore invalid url parse
            }
            return safeBase
        },

        async session({ session, user }) {
            if (session.user) {
                // @ts-expect-error custom
                session.user.id = user.id
                // @ts-expect-error custom
                session.user.role = user.role
            }
            return session
        },
    },

})
