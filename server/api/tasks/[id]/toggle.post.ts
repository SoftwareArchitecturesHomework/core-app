import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  const user = session?.user

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const taskId = parseInt(getRouterParam(event, 'id') || '')

  if (isNaN(taskId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid task ID',
    })
  }

  // Fetch the task with project info
  const task = await getTaskWithProjectById(taskId)

  if (!task) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Task not found',
    })
  }

  // Verify user has access to toggle this task
  const hasAccess = task.assigneeId === user.id

  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have permission to modify this task',
    })
  }

  const updatedTask = await toggleTaskCompletion(taskId, !task.isDone)

  return updatedTask
})
