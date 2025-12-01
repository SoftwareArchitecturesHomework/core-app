import { getServerSession } from '#auth'
import { getTaskWithProjectById } from '~~/server/repositories/TaskRepository'
import { createTimeEntry } from '~~/server/repositories/timeEntryRepository'

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

  const body = await readBody(event)
  const { taskId, date, hours, note } = body

  // Validate required fields
  if (!taskId || !date || !hours) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Task ID, date, and hours are required',
    })
  }

  // Validate hours is positive
  if (typeof hours !== 'number' || hours <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Hours must be a positive number',
    })
  }

  try {
    // Verify task exists and user has access to it
    const task = await getTaskWithProjectById(Number(taskId))

    if (!task) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Task not found',
      })
    }

    // Verify user has access to the task
    const userId = Number(user.id)
    const hasAccess = task.assigneeId === userId

    if (!hasAccess) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have access to this task',
      })
    }

    // Create time entry
    return await createTimeEntry(
      Number(taskId),
      userId,
      new Date(date),
      hours,
      note || null,
    )
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error creating time entry:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create time entry',
    })
  }
})
