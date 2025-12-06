export default defineEventHandler(async (event) => {
  const { id: discordUserId, task_id, user_id } = await readBody(event)

  // Verify the requester is a valid user
  const user = await getUserByDiscordId(discordUserId)

  // Get the task and verify it exists
  const task = await prisma.task.findUnique({
    where: { id: task_id },
    include: {
      project: {
        include: {
          userProjects: true,
        },
      },
      assignee: true,
    },
  })

  if (!task) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Task not found',
    })
  }

  // Check if user has permission (creator or project owner)
  if (task.creatorId !== user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have permission to assign this task',
    })
  }

  // Resolve Discord user ID to internal user ID
  const userAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'discord',
        providerAccountId: user_id,
      },
    },
    include: {
      user: true,
    },
  })

  if (!userAccount) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No registered user found with that Discord ID',
    })
  }

  const assigneeId = userAccount.userId

  // Verify assignee is a project participant
  if (task.project) {
    const isParticipant = task.project.userProjects.some(
      (up) => up.userId === assigneeId,
    )

    if (!isParticipant) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Assignee must be a project participant',
      })
    }
  }

  // Update task assignee
  const updatedTask = await changeTaskAssignee(task_id, assigneeId)

  return {
    task: {
      id: updatedTask.id,
      name: updatedTask.name,
      end: updatedTask.endDate,
      start: updatedTask.startDate,
      description: updatedTask.description,
    },
    assignee: {
      name: userAccount.user.name,
      email: userAccount.user.email,
    },
    assigner: {
      name: user.name,
      email: user.email,
    },
  }
})
