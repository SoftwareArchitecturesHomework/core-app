import { PrismaClient } from '@prisma/client'
import { getServerSession } from '#auth'
import { ExtendedUser } from '~~/types/extended-user'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    // Authenticate user
    const session = await getServerSession(event)
    const user = session?.user as ExtendedUser | undefined
    if (!session?.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        })
    }

    const taskId = getRouterParam(event, 'id')

    if (!taskId || isNaN(Number(taskId))) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid task ID'
        })
    }

    try {
        const task = await prisma.task.findUnique({
            where: {
                id: Number(taskId)
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        role: true
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        role: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        ownerId: true,
                        userProjects: {
                            select: {
                                userId: true,
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        image: true,
                                        role: true
                                    }
                                }
                            }
                        }
                    }
                },
                meetingParticipants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                                role: true
                            }
                        }
                    }
                },
                timeEntries: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true
                            }
                        }
                    },
                    orderBy: {
                        date: 'desc'
                    }
                }
            }
        })

        if (!task) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Task not found'
            })
        }

        // Verify user has access to this task
        const userId = Number(user?.id)
        const hasAccess =
            task.creatorId === userId ||
            task.assigneeId === userId ||
            (task.project && (
                task.project.ownerId === userId ||
                task.project.userProjects.some(up => up.userId === userId)
            )) ||
            (task.type === 'MEETING' && task.meetingParticipants.some(mp => mp.userId === userId))

        if (!hasAccess) {
            throw createError({
                statusCode: 403,
                statusMessage: 'You do not have access to this task'
            })
        }

        return task
    } catch (error: any) {
        if (error.statusCode) {
            throw error
        }
        console.error('Error fetching task:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch task'
        })
    }
})