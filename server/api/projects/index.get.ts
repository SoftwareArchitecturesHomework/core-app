import { defineEventHandler, getQuery } from 'h3'
import { getServerSession } from '#auth'
import {
  getProjectByOwnerId,
  getProjectByParticipantId,
} from '~~/server/repositories/projectRepository'

export default defineEventHandler(async (event) => {
  const { ownerId, participantId } = getQuery(event)
  const session = await getServerSession(event)
  const user = session?.user

  if (!session?.user || !user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  if (ownerId) {
    return getProjectByOwnerId(Number.parseInt(ownerId as string))
  }

  if (participantId) {
    return getProjectByParticipantId(Number.parseInt(participantId as string))
  }

  return prisma.project.findMany()
})
