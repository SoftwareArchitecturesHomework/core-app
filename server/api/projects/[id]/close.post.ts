import { getServerSession } from '#auth'
import {
  closeProject,
  getProjectById,
} from '~~/server/repositories/projectRepository'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  const user = session?.user

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const projectId = parseInt(getRouterParam(event, 'id') || '')

  if (isNaN(projectId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid project ID',
    })
  }
  // Fetch the project
  const project = await getProjectById(projectId)

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project not found',
    })
  }

  // Validate that the user is the owner
  if (project.ownerId !== user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only the project owner can close the project',
    })
  }

  // Validate that the project is not already closed
  if (project.endDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project is already closed',
    })
  }

  const currentDate = new Date()

  // Validate that endDate is not earlier than startDate
  if (currentDate < project.startDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'End date cannot be earlier than start date',
    })
  }

  // Update the project with the current date as endDate
  const updatedProject = await closeProject(projectId)

  return updatedProject
})
