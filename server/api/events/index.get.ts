import { prisma } from '~~/server/utils/prisma'
import { defineEventHandler} from 'h3'
import {getServerSession} from "#auth";

export default defineEventHandler(async (event) => {
    const session = await getServerSession(event)
    const user = session?.user

    if (!session?.user || !user?.id) {
        console.error(
            'Unauthorized - session.user:',
            session?.user,
            'user.id:',
            user?.id,
        )
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        })
    }

    return prisma.task.findMany({
        where: {
          OR:[
            {
              assigneeId: user.id,
            },
            {
              creatorId: user.id
            }
          ]
        },
      include: {
        meetingParticipants: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    })

})

