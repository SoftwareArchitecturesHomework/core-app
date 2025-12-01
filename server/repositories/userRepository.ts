import { prisma } from '~~/server/utils/prisma'


export async function getUserById(userId: number) {
    return await prisma.user.findUnique({
        where: {
            id: userId,
        },
    })
}

export async function getUsersForTimeAdministration(managerId: number, startDate: Date, endDate: Date) {
    return await prisma.user.findMany({
        where: { managerId: managerId }, // Managers see their reports
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            timeEntries: {
                where: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                select: {
                    hours: true,
                },
            },
            tasks: {
                where: {
                    type: 'VACATION',
                    isApproved: true,
                    AND: [
                        {
                            startDate: {
                                lte: endDate,
                            },
                        },
                        {
                            endDate: {
                                gte: startDate,
                            },
                        },
                    ],
                },
                select: {
                    startDate: true,
                    endDate: true,
                },
            },
        },
    })
}