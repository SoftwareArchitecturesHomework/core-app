import { prisma } from '~~/server/utils/prisma'

export async function getPendingVacationRequestsForManager(managerId: number) {
  const vacations = await prisma.task.findMany({
    where: {
      type: 'VACATION',
      isApproved: null,
      creator: {
        managerId: managerId,
      },
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
    },
    orderBy: {
      startDate: 'asc',
    },
  })
  return vacations
}

export async function createTaskForProject(
  name: string,
  type: 'TASK' | 'MEETING',
  description: string | null,
  id: number,
  creatorId: number,
  assigneeId?: number,
) {
  const task = await prisma.task.create({
    data: {
      name,
      description: description || null,
      type: type,
      projectId: id,
      creatorId: creatorId,
      assigneeId: assigneeId || null,
    },
  })

  return task
}

export function toggleTaskCompletion(taskId: number, isDone: boolean) {
  return prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      isDone: isDone,
    },
  })
}

export async function getTaskWithProjectById(id: number) {
  return await prisma.task.findUnique({
    where: { id: id },
    include: {
      project: {
        include: {
          userProjects: true,
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })
}

export async function getTaskWithCreatorById(id: number) {
  return await prisma.task.findUnique({
    where: { id: id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          managerId: true,
        },
      },
    },
  })
}

export async function approveVacationRequest(taskId: number) {
  return await prisma.task.update({
    where: { id: Number(taskId) },
    data: { isApproved: true },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })
}

export async function rejectVacationRequest(taskId: number) {
  return await prisma.task.update({
    where: { id: Number(taskId) },
    data: { isApproved: false },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })
}

export async function getTaskDetailsById(taskId: number) {
  return await prisma.task.findUnique({
    where: {
      id: Number(taskId),
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          userProjects: {
            select: {
              userId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  role: true,
                },
              },
            },
          },
        },
      },
      meetingParticipants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
        },
      },
      timeEntries: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      },
    },
  })
}

export async function getTaskById(taskId: number) {
  return await prisma.task.findUnique({
    where: {
      id: Number(taskId),
    },
  })
}

export async function deleteTaskById(taskId: number) {
  return await prisma.task.delete({
    where: {
      id: Number(taskId),
    },
  })
}

export async function changeTaskAssignee(
  taskId: number,
  assigneeId: number | null,
) {
  return await prisma.task.update({
    where: { id: taskId },
    data: {
      assigneeId: assigneeId,
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
    },
  })
}
