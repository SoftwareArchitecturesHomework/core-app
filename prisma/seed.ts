import { Role, TaskType } from '~~/.generated/prisma/client'
import { prisma } from '~~/server/utils/prisma'

let protectedUserIds: string[] | any[]

async function cleanup() {
  console.info('Starting cleanup: Identifying protected users...')

  protectedUserIds = (
    await prisma.user.findMany({
      where: {
        accounts: {
          some: {},
        },
      },
      select: { id: true },
    })
  ).map((u) => u.id)

  const idsToExclude = protectedUserIds.length > 0 ? protectedUserIds : [0]

  console.info(
    `Found ${protectedUserIds.length} users to protect (IDs: ${idsToExclude}).`,
  )

  await prisma.timeEntry.deleteMany({
    where: { userId: { notIn: idsToExclude } },
  })

  await prisma.meetingParticipant.deleteMany({
    where: { userId: { notIn: idsToExclude } },
  })

  await prisma.task.deleteMany({
    where: {
      OR: [
        { creatorId: { notIn: idsToExclude } },
        { assigneeId: { notIn: idsToExclude } },
      ],
    },
  })

  await prisma.userProject.deleteMany({
    where: {
      OR: [
        { userId: { notIn: idsToExclude } },
        {
          project: {
            ownerId: { notIn: idsToExclude },
          },
        },
      ],
    },
  })

  await prisma.project.deleteMany({
    where: { ownerId: { notIn: idsToExclude } },
  })

  await prisma.session.deleteMany({
    where: { userId: { notIn: idsToExclude } },
  })
  await prisma.account.deleteMany({
    where: { userId: { notIn: idsToExclude } },
  })

  await prisma.verificationToken.deleteMany()

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: {
        notIn: idsToExclude,
      },
    },
  })

  console.info(
    `Deleted ${deletedUsers.count} mock users and their associated data.`,
  )
}

async function seed() {
  const today = new Date()
  const futureDate = new Date()
  futureDate.setMonth(today.getMonth() + 3)

  console.info(' Starting database seed...')

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      name: 'Alice Admin',
      role: Role.ADMIN,
    },
  })

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@company.com',
      name: 'Bob Manager',
      role: Role.MANAGER,
      managerId: adminUser.id,
    },
  })

  const employeeUser = await prisma.user.create({
    data: {
      email: 'employee@company.com',
      name: 'Charlie Employee',
      role: Role.EMPLOYEE,
      managerId: managerUser.id,
    },
  })

  const projectA = await prisma.project.create({
    data: {
      name: 'Nuxt 3 Dashboard App',
      startDate: today,
      plannedEndDate: futureDate,
      ownerId: adminUser.id,
      userProjects: {
        create: [
          { userId: adminUser.id },
          { userId: managerUser.id },
          { userId: employeeUser.id },
        ],
      },
    },
  })

  const projectB = await prisma.project.create({
    data: {
      name: 'Legacy API Migration (Completed)',
      startDate: today,
      endDate: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 45,
      ),
      plannedEndDate: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 60,
      ),
      ownerId: managerUser.id,
      userProjects: {
        create: [{ userId: employeeUser.id }],
      },
    },
  })

  const mockProjectIds = [projectA.id, projectB.id]

  const task1 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employeeUser.id,
      name: 'Implement User Authentication',
      isDone: true,
      projectId: projectA.id,
    },
  })

  const task2 = await prisma.task.create({
    data: {
      type: TaskType.MEETING,
      creatorId: adminUser.id,
      assigneeId: managerUser.id,
      name: 'Weekly Sync Up',
      description: 'Review progress and blockages.',
      isDone: false,
      projectId: projectA.id,
    },
  })

  await prisma.meetingParticipant.createMany({
    data: [
      { meetingId: task2.id, userId: adminUser.id },
      { meetingId: task2.id, userId: managerUser.id },
      { meetingId: task2.id, userId: employeeUser.id },
    ],
  })

  await prisma.timeEntry.createMany({
    data: [
      {
        taskId: task1.id,
        userId: employeeUser.id,
        date: today,
        hours: 10.0,
        note: 'Finished auth flow.',
      },
      {
        taskId: task2.id,
        userId: managerUser.id,
        date: today,
        hours: 2.5,
        note: 'Preparation and meeting time.',
      },
    ],
  })

  if (protectedUserIds.length > 0) {
    const userProjectLinks = []

    // Loop through all protected user IDs and all new project IDs
    for (const userId of protectedUserIds) {
      for (const projectId of mockProjectIds) {
        userProjectLinks.push({
          userId,
          projectId,
        })
      }
    }

    if (userProjectLinks.length > 0) {
      await prisma.userProject.createMany({
        data: userProjectLinks,
        skipDuplicates: true, // Important: Prevents errors if a link somehow already exists
      })
      console.info(
        `Auto-linked ${protectedUserIds.length} Google user(s) to ${mockProjectIds.length} projects.`,
      )
    }
  }

  console.info('Seeding finished.')
}

export { cleanup, seed }
