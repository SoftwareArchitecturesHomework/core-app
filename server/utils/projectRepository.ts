export async function createProject(
  ownerId: number,
  name: string,
  startDate: Date,
  plannedEndDate?: Date,
) {
  const project = await prisma.project.create({
    data: {
      name: name,
      startDate: startDate,
      plannedEndDate: plannedEndDate ? plannedEndDate : null,
      ownerId: ownerId,
      userProjects: {
        create: {
          userId: ownerId,
        },
      },
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })

  return project
}
export async function getProjectByOwnerId(ownerId: number) {
  return prisma.project.findMany({
    where: {
      ownerId: ownerId,
    },
  })
}

export async function getProjectByParticipantId(participantId: number) {
  return prisma.project.findMany({
    where: {
      userProjects: {
        some: {
          userId: participantId,
        },
      },
    },
  })
}

export async function getOwnedProject(ownerId: number, projectId: number) {
  return prisma.project.findUnique({
    where: {
      ownerId: ownerId,
      id: projectId,
    },
  })
}

export async function getProjectById(projectId: number) {
  return await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  })
}

export async function getProjectDetailsById(projectId: number) {
  return await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
      userProjects: {
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
      tasks: true,
    },
  })
}

export async function closeProject(projectId: number) {
  return await prisma.project.update({
    where: { id: projectId },
    data: {
      endDate: new Date(),
    },
  })
}
