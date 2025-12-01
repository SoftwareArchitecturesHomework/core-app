import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  // Authenticate user
  const session = await getServerSession(event)
  const user = session?.user
  if (!user?.id) {
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
    const task = await getTaskById(Number(taskId))

    if (!task) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Task not found',
      })
    }

    // Validate that the user is the creator
    if (task.creatorId !== Number(user.id)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only the task creator can delete this task',
      })
    }

    // Delete the task (this will cascade delete time entries and meeting participants)
    await deleteTaskById(Number(taskId))

    return {
      success: true,
      message: 'Task deleted successfully',
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error deleting task:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete task',
    })
  }
})
