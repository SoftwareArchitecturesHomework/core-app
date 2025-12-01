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

export async function removeUserFromProject(
  projectId: number,
  userId: number,
  includeUser = false,
) {
  return await prisma.userProject.delete({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
    include: {
      user: includeUser,
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
