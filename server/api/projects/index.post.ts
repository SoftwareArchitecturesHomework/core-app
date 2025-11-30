import { getServerSession } from '#auth'
import { prisma } from '~~/server/utils/prisma'
import { ProjectCreationDto } from '~~/types/project-creation-dto'

export default defineEventHandler(async (event) => {
  // Use event.context.auth instead of getServerSession
  const session = await getServerSession(event)
  const user = session?.user

  if (!session?.user || !user?.id) {
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

  const body = (await readBody(event)) as ProjectCreationDto

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
    const project = await prisma.project.create({
      data: {
        name: projectName,
        startDate: new Date(startDate),
        plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : null,
        ownerId: user.id,
        userProjects: {
          create: {
            userId: user.id,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return project
  } catch (error) {
    console.error('Error creating project:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create project',
    })
  }
})
