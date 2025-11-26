import prisma from '~~/lib/prisma'
import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const { ownerId, participantId } = query

    // If both ownerId and participantId are provided, fetch projects that match either condition
    if (ownerId && participantId) {
        return prisma.project.findMany({
            where: {
                OR: [
                    {
                        ownerId: Number.parseInt(ownerId as string),
                    },
                    {
                        userProjects: {
                            some: {
                                userId: Number.parseInt(participantId as string),
                            },
                        },
                    },
                ],
            },
        })
    }

    if (ownerId) {
        return prisma.project.findMany({
            where: {
                ownerId: Number.parseInt(ownerId as string),
            },
        })
    }

    if (participantId) {
        return prisma.project.findMany({
            where: {
                userProjects: {
                    some: {
                        userId: Number.parseInt(participantId as string),
                    },
                },
            },
        })
    }

    return prisma.project.findMany()
})

