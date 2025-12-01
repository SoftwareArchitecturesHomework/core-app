import { Role, TaskType } from '~~/.generated/prisma/client'
import { prisma } from '~~/server/utils/prisma'
import bcrypt from 'bcrypt'

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

  // Delete all time entries (including those by protected users in seed projects)
  await prisma.timeEntry.deleteMany({})

  // Delete all meeting participants
  await prisma.meetingParticipant.deleteMany({})

  // Delete all tasks (including those created by protected users during seed)
  await prisma.task.deleteMany({})

  // Delete all user-project relationships
  await prisma.userProject.deleteMany({})

  // Delete all projects (this fixes the infinite generation issue)
  await prisma.project.deleteMany({})

  // Clean up sessions/accounts only for non-protected users
  await prisma.session.deleteMany({
    where: { userId: { notIn: idsToExclude } },
  })
  await prisma.account.deleteMany({
    where: { userId: { notIn: idsToExclude } },
  })

  await prisma.verificationToken.deleteMany()

  // Delete only non-protected users
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: {
        notIn: idsToExclude,
      },
    },
  })

  console.info(
    `Deleted ${deletedUsers.count} mock users and all seed data.`,
  )
}

async function seed() {
  const today = new Date()
  const futureDate = new Date()
  futureDate.setMonth(today.getMonth() + 3)
  const hashedPassword = await bcrypt.hash('defaultPassword123', 10)


  console.info('Starting database seed...')

  // Determine the manager - use protected user if available, otherwise create admin
  let mainUser
  if (protectedUserIds.length > 0) {
    // Use the first protected user as the manager
    mainUser = await prisma.user.findUnique({
      where: { id: protectedUserIds[0] },
    })

    if (!mainUser) {
      throw new Error('Protected user not found')
    }

    // Update their role to MANAGER if they aren't already
    if (mainUser.role !== Role.MANAGER) {
      mainUser = await prisma.user.update({
        where: { id: mainUser.id },
        data: { role: Role.MANAGER },
      })
    }

    console.info(`Using protected user ${mainUser.email} as manager`)
  } else {
    // Create admin user as before
    mainUser = await prisma.user.create({
      data: {
        email: 'admin@company.com',
        name: 'Alice Admin',
        role: Role.MANAGER,
        password: hashedPassword
      },
    })
  }

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@company.com',
      name: 'Bob Manager',
      role: Role.MANAGER,
      managerId: mainUser.id,
      password: hashedPassword
    },
  })

  const employeeUser = await prisma.user.create({
    data: {
      email: 'employee@company.com',
      name: 'Charlie Employee',
      role: Role.EMPLOYEE,
      managerId: mainUser.id,
      password: hashedPassword
    },
  })

  const employee2 = await prisma.user.create({
    data: {
      email: 'diana@company.com',
      name: 'Diana Developer',
      role: Role.EMPLOYEE,
      managerId: mainUser.id,
      password: hashedPassword
    },
  })

  const employee3 = await prisma.user.create({
    data: {
      email: 'ethan@company.com',
      name: 'Ethan Engineer',
      role: Role.EMPLOYEE,
      managerId: mainUser.id,
      password: hashedPassword
    },
  })

  const employee4 = await prisma.user.create({
    data: {
      email: 'fiona@company.com',
      name: 'Fiona Frontend',
      role: Role.EMPLOYEE,
      managerId: managerUser.id, // Reports to Bob
      password: hashedPassword
    },
  })

  const projectA = await prisma.project.create({
    data: {
      name: 'Nuxt 3 Dashboard App',
      startDate: today,
      plannedEndDate: futureDate,
      ownerId: mainUser.id,
      userProjects: {
        create: [
          { userId: mainUser.id },
          { userId: managerUser.id },
          { userId: employeeUser.id },
          { userId: employee2.id },
          { userId: employee3.id },
          { userId: employee4.id },
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
        create: [
          { userId: employeeUser.id },
          { userId: employee2.id },
          { userId: employee3.id },
        ],
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
      description: 'Set up OAuth2 and JWT authentication',
      isDone: true,
      projectId: projectA.id,
      dueDate: new Date(today.getFullYear(), today.getMonth() - 2, 15),
    },
  })

  const task2 = await prisma.task.create({
    data: {
      type: TaskType.MEETING,
      creatorId: mainUser.id,
      assigneeId: managerUser.id,
      name: 'Weekly Sync Up',
      description: 'Review progress and blockages.',
      isDone: false,
      projectId: projectA.id,
    },
  })

  const task3 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: mainUser.id,
      assigneeId: employee2.id,
      name: 'Design Database Schema',
      description: 'Create Prisma schema for core entities',
      isDone: true,
      projectId: projectA.id,
      dueDate: new Date(today.getFullYear(), today.getMonth() - 3, 20),
    },
  })

  const task4 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employee4.id,
      name: 'Build Dashboard UI',
      description: 'Create responsive dashboard with Nuxt UI components',
      isDone: false,
      projectId: projectA.id,
      dueDate: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate() + 7),
    },
  })

  const task5 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employee3.id,
      name: 'API Integration',
      description: 'Connect frontend to backend services',
      isDone: false,
      projectId: projectA.id,
      dueDate: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate() + 14),
    },
  })

  const task6 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: mainUser.id,
      assigneeId: employee2.id,
      name: 'Database Migration Scripts',
      description: 'Write migration scripts for legacy data',
      isDone: true,
      projectId: projectB.id,
      dueDate: new Date(today.getFullYear(), today.getMonth() - 3, 10),
    },
  })

  const task7 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employeeUser.id,
      name: 'Write Unit Tests',
      description: 'Add test coverage for authentication module',
      isDone: true,
      projectId: projectA.id,
      dueDate: new Date(today.getFullYear(), today.getMonth() - 2, 25),
    },
  })

  const task8 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employee3.id,
      name: 'Setup CI/CD Pipeline',
      description: 'Configure GitHub Actions for automated deployment',
      isDone: false,
      projectId: projectA.id,
      dueDate: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate() + 5),
    },
  })

  await prisma.meetingParticipant.createMany({
    data: [
      { meetingId: task2.id, userId: mainUser.id },
      { meetingId: task2.id, userId: managerUser.id },
      { meetingId: task2.id, userId: employeeUser.id },
    ],
  })

  // Create vacation requests from employees
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)

  const twoWeeksLater = new Date(nextWeek)
  twoWeeksLater.setDate(nextWeek.getDate() + 14)

  const nextMonth = new Date(today)
  nextMonth.setMonth(today.getMonth() + 1)

  const nextMonthEnd = new Date(nextMonth)
  nextMonthEnd.setDate(nextMonth.getDate() + 3)

  const vacation1 = await prisma.task.create({
    data: {
      type: TaskType.VACATION,
      creatorId: employeeUser.id,
      name: 'Summer Vacation',
      description: 'Two weeks off for family vacation',
      isDone: false,
      startDate: nextWeek,
      endDate: twoWeeksLater,
    },
  })

  const vacation2 = await prisma.task.create({
    data: {
      type: TaskType.VACATION,
      creatorId: managerUser.id,
      name: 'Conference Trip',
      description: 'Attending tech conference',
      isDone: false,
      startDate: nextMonth,
      endDate: nextMonthEnd,
    },
  })

  await prisma.timeEntry.createMany({
    data: [
      // August entries - Task 3 (Database Schema) - employee2
      {
        taskId: task3.id,
        userId: employee2.id,
        date: new Date(today.getFullYear(), today.getMonth() - 3, 5),
        hours: 7.0,
        note: 'Initial schema design and entity relationships',
      },
      {
        taskId: task3.id,
        userId: employee2.id,
        date: new Date(today.getFullYear(), today.getMonth() - 3, 6),
        hours: 8.0,
        note: 'Implemented User, Project, and Task models',
      },
      {
        taskId: task3.id,
        userId: employee2.id,
        date: new Date(today.getFullYear(), today.getMonth() - 3, 9),
        hours: 6.5,
        note: 'Added TimeEntry and Meeting models',
      },
      {
        taskId: task3.id,
        userId: employee2.id,
        date: new Date(today.getFullYear(), today.getMonth() - 3, 10),
        hours: 4.0,
        note: 'Schema review and adjustments',
      },
      // August entries - Task 6 (Migration Scripts) - employee2
      {
        taskId: task6.id,
        userId: employee2.id,
        date: new Date(today.getFullYear(), today.getMonth() - 3, 12),
        hours: 8.0,
        note: 'Analyzed legacy database structure',
      },
      {
        taskId: task6.id,
        userId: employee2.id,
        date: new Date(today.getFullYear(), today.getMonth() - 3, 13),
        hours: 8.0,
        note: 'Created data transformation scripts',
      },
      {
        taskId: task6.id,
        userId: employee2.id,
        date: new Date(today.getFullYear(), today.getMonth() - 3, 16),
        hours: 7.5,
        note: 'Testing migration on staging environment',
      },
      {
        taskId: task6.id,
        userId: employee2.id,
        date: new Date(today.getFullYear(), today.getMonth() - 3, 17),
        hours: 6.5,
        note: 'Final migration execution and validation',
      },
      // September entries - Task 1 (Authentication) - employeeUser
      {
        taskId: task1.id,
        userId: employeeUser.id,
        date: new Date(today.getFullYear(), today.getMonth() - 2, 3),
        hours: 6.5,
        note: 'Research OAuth2 providers and JWT libraries',
      },
      {
        taskId: task1.id,
        userId: employeeUser.id,
        date: new Date(today.getFullYear(), today.getMonth() - 2, 4),
        hours: 8.0,
        note: 'Implemented OAuth2 flow with Google',
      },
      {
        taskId: task1.id,
        userId: employeeUser.id,
        date: new Date(today.getFullYear(), today.getMonth() - 2, 7),
        hours: 7.5,
        note: 'Added JWT token generation and validation',
      },
      {
        taskId: task1.id,
        userId: employeeUser.id,
        date: new Date(today.getFullYear(), today.getMonth() - 2, 8),
        hours: 5.0,
        note: 'Testing and bug fixes for auth flow',
      },
      // September entries - Task 7 (Unit Tests) - employeeUser
      {
        taskId: task7.id,
        userId: employeeUser.id,
        date: new Date(today.getFullYear(), today.getMonth() - 2, 14),
        hours: 6.0,
        note: 'Set up testing framework and wrote first test cases',
      },
      {
        taskId: task7.id,
        userId: employeeUser.id,
        date: new Date(today.getFullYear(), today.getMonth() - 2, 15),
        hours: 7.0,
        note: 'Completed authentication module test coverage',
      },
      {
        taskId: task7.id,
        userId: employeeUser.id,
        date: new Date(today.getFullYear(), today.getMonth() - 2, 16),
        hours: 5.5,
        note: 'Added integration tests and edge cases',
      },
      // October entries - Task 4 (Dashboard UI) - employee4
      {
        taskId: task4.id,
        userId: employee4.id,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 4),
        hours: 7.0,
        note: 'Set up Nuxt UI and created base layout',
      },
      {
        taskId: task4.id,
        userId: employee4.id,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 5),
        hours: 8.0,
        note: 'Built project list and card components',
      },
      {
        taskId: task4.id,
        userId: employee4.id,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 6),
        hours: 6.5,
        note: 'Implemented time administration view',
      },
      {
        taskId: task4.id,
        userId: employee4.id,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 11),
        hours: 7.5,
        note: 'Added responsive design and dark mode',
      },
      {
        taskId: task4.id,
        userId: employee4.id,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 12),
        hours: 6.0,
        note: 'Created vacation request components',
      },
      // October entries - Task 5 (API Integration) - employee3
      {
        taskId: task5.id,
        userId: employee3.id,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 7),
        hours: 5.0,
        note: 'Defined API endpoints for projects',
      },
      {
        taskId: task5.id,
        userId: employee3.id,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 8),
        hours: 7.0,
        note: 'Implemented user and task API endpoints',
      },
      {
        taskId: task5.id,
        userId: employee3.id,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 11),
        hours: 6.5,
        note: 'Added error handling and validation',
      },
      {
        taskId: task5.id,
        userId: employee3.id,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 13),
        hours: 8.0,
        note: 'Integrated time entries API with frontend',
      },
      // October entries - Task 8 (CI/CD) - employee3
      {
        taskId: task8.id,
        userId: employee3.id,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 18),
        hours: 6.0,
        note: 'Set up GitHub Actions workflow files',
      },
      {
        taskId: task8.id,
        userId: employee3.id,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 19),
        hours: 7.5,
        note: 'Configured build and test jobs',
      },
      {
        taskId: task8.id,
        userId: employee3.id,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 20),
        hours: 5.5,
        note: 'Added deployment pipeline for staging',
      },
      // Additional October entries - spread across employees
      {
        taskId: task4.id,
        userId: employee4.id,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 18),
        hours: 6.5,
        note: 'UI polish and accessibility improvements',
      },
      {
        taskId: task5.id,
        userId: employee3.id,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 25),
        hours: 7.0,
        note: 'Performance optimization and caching',
      },
      // Manager working on various tasks
      {
        taskId: task5.id,
        userId: managerUser.id,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 14),
        hours: 4.0,
        note: 'Code review and architecture planning',
      },
      {
        taskId: task8.id,
        userId: managerUser.id,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 21),
        hours: 3.5,
        note: 'Review CI/CD configuration and approval',
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
