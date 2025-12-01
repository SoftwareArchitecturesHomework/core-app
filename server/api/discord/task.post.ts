import { TaskType } from '~~/.generated/prisma/enums'

export default defineEventHandler(async (event) => {
  const { id: discordUserId, name, project_id } = await readBody(event)
  const user = await getUserByDiscordId(discordUserId)
  const project = await getOwnedProject(user.id, project_id)

  if (!project) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: You do not own this project',
    })
  }

  const task = await createTaskForProject(
    name,
    TaskType.TASK,
    null,
    project.id,
    user.id,
  )

  return {
    id: task.id,
  }
})
