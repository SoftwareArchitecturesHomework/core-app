import { getServerSession } from '#auth'
import { getTaskDetailsById } from '~~/server/repositories/taskRepository'

export default defineEventHandler(async (event) => {
  // Authenticate user
  const session = await getServerSession(event)

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const taskId = getRouterParam(event, 'id')

  if (!taskId || isNaN(Number(taskId))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid task ID',
    })
  }

  try {
    const task = await getTaskDetailsById(Number(taskId))

    if (!task) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Task not found',
      })
    }

    return task
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error fetching task:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch task',
    })
  }
})
