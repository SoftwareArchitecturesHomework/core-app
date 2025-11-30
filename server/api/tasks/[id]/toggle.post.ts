import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)

  if (!session?.user?.email) {
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

  // Fetch the current user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
    })
  }

  // Fetch the task with project info
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        select: {
          ownerId: true,
          userProjects: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  })

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

  // Toggle the task status
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      isDone: !task.isDone,
    },
  })

  return updatedTask
})
