import { getServerSession } from '#auth'
import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { prisma } from '~~/server/utils/prisma'

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
  const { name, description, type, assigneeId } = body

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Task name is required',
    })
  }

  if (!type) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Task type is required',
    })
  }

  // Validate task type
  const validTypes = ['VACATION', 'MEETING', 'TASK', 'INDIVIDUALTASK']
  if (!validTypes.includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid task type',
    })
  }

  try {
    // Check if the project exists and if the user has access to it
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        userProjects: {
          where: { userId: user.id },
        },
      },
    })

    if (!project) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Project not found',
      })
    }

    // Check if user is owner or participant
    const isOwner = project.ownerId === user.id
    const isParticipant = project.userProjects.length > 0

    if (!isOwner && !isParticipant) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have access to this project',
      })
    }

    // If assigneeId is provided, verify they are a participant
    if (assigneeId) {
      const assignee = await prisma.userProject.findUnique({
        where: {
          projectId_userId: {
            projectId: id,
            userId: assigneeId,
          },
        },
      })

      if (!assignee) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Assignee must be a participant in the project',
        })
      }
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        name,
        description: description || null,
        type,
        projectId: id,
        creatorId: user.id,
        assigneeId: assigneeId || null,
      },
    })

    return task
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error creating task:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create task',
    })
  }
})
