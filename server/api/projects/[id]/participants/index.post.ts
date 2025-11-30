import { getServerSession } from '#auth'
import { defineEventHandler, getRouterParam, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  const user = session?.user

  if (!session?.user || !user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const projectId = getRouterParam(event, 'id')

  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project ID is required',
    })
  }

  const id = Number.parseInt(projectId)

  if (Number.isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid project ID',
    })
  }

  const body = await readBody(event)
  const { userId } = body

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    })
  }

  try {
    // Check if the project exists and if the current user is the owner
    const project = await prisma.project.findUnique({
      where: { id },
    })

    if (!project) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Project not found',
      })
    }

    if (project.ownerId !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only the project owner can add participants',
      })
    }

    // Check if user exists
    const userToAdd = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!userToAdd) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.userProject.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userId,
        },
      },
    })

    if (existingParticipant) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User is already a participant in this project',
      })
    }

    // Add the participant
    const userProject = await prisma.userProject.create({
      data: {
        projectId: id,
        userId: userId,
      },
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
    })

    return userProject
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error adding participant:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to add participant',
    })
  }
})
