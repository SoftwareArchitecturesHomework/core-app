import { getServerSession } from '#auth'
import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
    const session = await getServerSession(event)
    const user = session?.user

    if (!session?.user || !user?.id) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        })
    }

    const query = getQuery(event)
    const { excludeProjectId, projectId } = query

    try {
        let users

        if (excludeProjectId) {
            const projectId = Number.parseInt(excludeProjectId as string)

            if (Number.isNaN(projectId)) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Invalid project ID',
                })
            }

            // Get users who are NOT already participants in the project
            const projectParticipants = await prisma.userProject.findMany({
                where: { projectId },
                select: { userId: true },
            })

            const participantIds = projectParticipants.map((p) => p.userId)

            users = await prisma.user.findMany({
                where: {
                    id: {
                        notIn: participantIds,
                    },
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                },
            })
        }
        else if (projectId) {
            const projectID = Number.parseInt(projectId as string)

            if (Number.isNaN(projectID)) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Invalid project ID',
                })
            }

            // Get users who are participants in the project
            const projectParticipants = await prisma.userProject.findMany({
                where: { projectId: projectID },
                select: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                            role: true,
                        },
                    },
                },
            })

            users = projectParticipants.map((p) => p.user)
        }
        else {
            // Return all users
            users = await prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                },
            })
        }

        return users
    } catch (error: any) {
        if (error.statusCode) {
            throw error
        }

        console.error('Error fetching users:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch users',
        })
    }
})
