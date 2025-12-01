import { getServerSession } from '#auth'
import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { getProjectById } from '~~/server/repositories/projectRepository'
import {
  isUserInProject,
  removeUserFromProject,
} from '~~/server/repositories/userProjectRepository'

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

  const userIdParam = getRouterParam(event, 'userId')
  const userId = Number.parseInt(userIdParam as string)

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    })
  }

  try {
    // Check if the project exists and if the current user is the owner
    const project = await getProjectById(id)

    if (!project) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Project not found',
      })
    }

    if (project.ownerId !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only the project owner can remove participants',
      })
    }

    // Prevent owner from removing themselves
    if (userId === user.id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Project owner cannot be removed from the project',
      })
    }

    // Check if user is actually a participant
    const isInProject = await isUserInProject(id, userId)

    if (!isInProject) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User is not a participant in this project',
      })
    }

    await removeUserFromProject(id, userId)

    return {
      success: true,
      message: 'Participant removed successfully',
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error removing participant:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to remove participant',
    })
  }
})
