export async function addUserToProject(projectId: number, userId: number) {
  return await prisma.userProject.create({
    data: {
      projectId,
      userId,
    },
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
  })
}

export async function removeUserFromProject(projectId: number, userId: number) {
  return await prisma.userProject.delete({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  })
}

export async function isUserInProject(projectId: number, userId: number) {
  const userProject = await prisma.userProject.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  })
  return !!userProject
}
