import { getServerSession } from '#auth'
import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { getProjectDetailsById } from '~~/server/repositories/projectRepository'
import { addUserToProject } from '~~/server/repositories/userProjectRepository'
import { getUserById } from '~~/server/repositories/userRepository'

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
    const project = await getProjectDetailsById(id)

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
    const userToAdd = await getUserById(userId)

    if (!userToAdd) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    // Check if user is already a participant
    const isParticipant = project.userProjects
      .map((up) => up.userId)
      .includes(userId)

    if (isParticipant) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User is already a participant in this project',
      })
    }

    // Add the participant
    return await addUserToProject(id, userId)
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
