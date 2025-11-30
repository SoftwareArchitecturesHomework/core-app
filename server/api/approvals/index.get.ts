import { getServerSession } from '#auth'
import { defineEventHandler } from 'h3'
import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const session = await getServerSession(event)
    const user = session?.user

    if (!session?.user || !user?.id || user.role !== 'MANAGER') {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        })
    }

    const vacations = await prisma.task.findMany({
        where: {
            type: 'VACATION',
            isApproved: null,
            creator: {
                managerId: user.id,
            },
        },
        include: {
            creator: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                },
            },
        },
        orderBy: {
            startDate: 'asc',
        },
    })
    return vacations
})
