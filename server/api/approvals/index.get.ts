import { getServerSession } from '#auth'
import { defineEventHandler } from 'h3'
import { getPendingVacationRequestsForManager } from '~~/server/repositories/TaskRepository'

export default defineEventHandler(async (event) => {
    const session = await getServerSession(event)
    const user = session?.user

    if (!session?.user || !user?.id || user.role !== 'MANAGER') {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        })
    }

    return await getPendingVacationRequestsForManager(user.id)
})
