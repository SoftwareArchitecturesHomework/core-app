import { getServerSession } from '#auth'
import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { getProjectDetailsById } from '~~/server/repositories/projectRepository'
import { createTaskForProject } from '~~/server/repositories/TaskRepository'

const VALID_TYPES = ['MEETING', 'TASK']

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

  const { name, description, type, assigneeId } = await readBody(event)

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

  if (!VALID_TYPES.includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid task type',
    })
  }

  try {
    // Check if the project exists and if the user has access to it
    const project = await getProjectDetailsById(id)

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
    const task = await createTaskForProject(
      name,
      type,
      description,
      id,
      user.id,
      assigneeId || null,
    )

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
