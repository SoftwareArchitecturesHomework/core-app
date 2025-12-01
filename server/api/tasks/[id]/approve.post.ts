import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  const user = session?.user

  if (!user?.id || user.role !== 'MANAGER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only managers can approve vacation requests',
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
    // Fetch the task with creator info
    const task = await getTaskWithCreatorById(Number(taskId))

    if (!task) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Task not found',
      })
    }

    if (task.type !== 'VACATION') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only vacation requests can be approved',
      })
    }

    if (task.isApproved !== null) {
      throw createError({
        statusCode: 400,
        statusMessage: `This vacation request has already been ${
          task.isApproved ? 'approved' : 'rejected'
        }`,
      })
    }

    // Verify the user is the manager of the task creator
    if (task.creator.managerId !== Number(user.id)) {
      throw createError({
        statusCode: 403,
        statusMessage:
          'You can only approve vacation requests from your direct reports',
      })
    }

    // Approve the vacation
    return await approveVacationRequest(Number(taskId))
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error approving vacation:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to approve vacation request',
    })
  }
})
