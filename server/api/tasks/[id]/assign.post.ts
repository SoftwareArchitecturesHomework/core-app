import { getServerSession } from '#auth'
import {
  changeTaskAssignee,
  getTaskWithProjectById,
} from '~~/server/repositories/TaskRepository'

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

  const body = await readBody(event)
  const { assigneeId } = body

  if (
    assigneeId !== null &&
    (assigneeId === undefined || isNaN(Number(assigneeId)))
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Valid assignee ID is required',
    })
  }

  try {
    // Fetch task with project info
    const task = await getTaskWithProjectById(Number(taskId))

    if (!task) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Task not found',
      })
    }

    // Only project tasks can be assigned
    if (!task.project) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only project tasks can be assigned',
      })
    }

    // Verify user has permission (must be creator or project owner)
    const userId = Number(user.id)
    const isCreator = task.creatorId === userId

    if (!isCreator) {
      throw createError({
        statusCode: 403,
        statusMessage:
          'Only the task creator or project owner can assign tasks',
      })
    }

    // If assigneeId is provided (not null), verify they are a project participant
    if (assigneeId !== null) {
      const isParticipant = task.project.userProjects.some(
        (up) => up.userId === Number(assigneeId),
      )

      if (!isParticipant) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Assignee must be a project participant',
        })
      }
    }

    // Update task assignee
    const updatedTask = await changeTaskAssignee(
      Number(taskId),
      assigneeId !== null ? Number(assigneeId) : null,
    )

    return updatedTask
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error assigning task:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to assign task',
    })
  }
})
