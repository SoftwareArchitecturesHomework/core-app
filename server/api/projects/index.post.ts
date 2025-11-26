import { getServerSession } from '#auth'
import { Project } from '@prisma/client'
import prisma from '../../../lib/prisma'
import { ExtendedUser } from '../../../types/extended-user'
import { ProjectCreationDto } from '../../../types/project-creation-dto'


export default defineEventHandler(async (event) => {
    // Use event.context.auth instead of getServerSession
    const session = await getServerSession(event)
    const user = session?.user as ExtendedUser | undefined

    console.log('Session:', JSON.stringify(session, null, 2))
    console.log('User:', session?.user)

    if (!session?.user || !user?.id) {
        console.error('Unauthorized - session.user:', session?.user, 'user.id:', user?.id)
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        })
    }

    const body = await readBody(event) as ProjectCreationDto

    const { projectName, startDate, endDate } = body

    if (!projectName || !startDate) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Project name and start date are required'
        })
    }

    try {
        const project = await prisma.project.create({
            data: {
                name: projectName,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                ownerId: user.id,
                userProjects: {
                    create: {
                        userId: user.id
                    }
                }
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            }
        })

        return project
    } catch (error) {
        console.error('Error creating project:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create project'
        })
    }
})