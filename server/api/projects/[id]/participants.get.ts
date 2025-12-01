import { defineEventHandler } from 'h3'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {

  const projectId = parseInt(getRouterParam(event, 'id') || '')

  const session = await getServerSession(event)
  const user = session?.user
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }


  return prisma.userProject.findMany({
    where: {
      projectId: Number.parseInt( String(projectId) ),
      userId: {
        not: user?.id,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true
        },
      },
    },
  })
})
