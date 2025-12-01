export default defineEventHandler(async (event) => {
  const { id: discordUserId } = await readBody(event)
  const user = await getUserByDiscordId(discordUserId)
  const projects = await getProjectByOwnerId(user.id)

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
  }))
})
