import "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: number
            role: string
            name?: string | null
            email?: string | null
            image?: string | null
        }
    }

    interface User {
        id: number
        role: string
        name?: string | null
        email?: string | null
        image?: string | null
    }
}
