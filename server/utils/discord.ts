export async function getUserByDiscordId(discordId: unknown) {
  if (!discordId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid Discord user ID',
    })
  }

  const account = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'discord',
        providerAccountId: discordId.toString(),
      },
    },
    include: { user: true },
  })

  if (!account) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No WorkPlanner user registered with this Discord ID',
    })
  }

  return account.user
}
