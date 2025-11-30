import { getServerSession } from '#auth'
import { defineEventHandler, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  const user = session?.user

  if (!session?.user || !user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project ID is required',
    })
  }

  const projectId = Number.parseInt(id)

  if (Number.isNaN(projectId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid project ID',
    })
  }

  try {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        userProjects: {
          include: {
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
        },
        tasks: true,
      },
    })

    if (!project) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Project not found',
      })
    }

    return project
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error fetching project:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch project',
    })
  }
})
