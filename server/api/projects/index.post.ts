import { getServerSession } from '#auth'
import { createProject } from '~~/server/repositories/projectRepository'
import { ProjectCreationDto } from '~~/types/project-creation-dto'

export default defineEventHandler(async (event) => {
    const session = await getServerSession(event)
    const user = session?.user

    if (!session?.user || !user?.id || user.role !== 'MANAGER') {
        console.error(
            'Unauthorized - session.user:',
            session?.user,
            'user.id:',
            user?.id,
        )
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        })
    }

    const body = (await readBody(event))

    const { projectName, startDate, plannedEndDate } = body

    if (!projectName || !startDate) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Project name and start date are required',
        })
    }

    if (plannedEndDate) {
        const startDateObj = new Date(startDate)
        const endDateObj = new Date(plannedEndDate)

        if (endDateObj <= startDateObj) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Planned end date must be after start date',
            })
        }
    }

    try {
        return await createProject(user.id, projectName, new Date(startDate), plannedEndDate ? new Date(plannedEndDate) : undefined)
    } catch (error) {
        console.error('Error creating project:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create project',
        })
    }
})
