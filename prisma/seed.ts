import bcrypt from 'bcrypt'
import { Role, TaskType } from '~~/.generated/prisma/client'
import { prisma } from './prisma'

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

  console.info(`Deleted ${deletedUsers.count} mock users and all seed data.`)
}

async function seed() {
  const today = new Date('2025-12-03')
  const futureDate = new Date('2026-03-03')
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
        password: hashedPassword,
      },
    })
  }

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@company.com',
      name: 'Bob Manager',
      role: Role.MANAGER,
      managerId: mainUser.id,
      password: hashedPassword,
    },
  })

  const employeeUser = await prisma.user.create({
    data: {
      email: 'employee@company.com',
      name: 'Charlie Employee',
      role: Role.EMPLOYEE,
      managerId: mainUser.id,
      password: hashedPassword,
    },
  })

  const employee2 = await prisma.user.create({
    data: {
      email: 'diana@company.com',
      name: 'Diana Developer',
      role: Role.EMPLOYEE,
      managerId: mainUser.id,
      password: hashedPassword,
    },
  })

  const employee3 = await prisma.user.create({
    data: {
      email: 'ethan@company.com',
      name: 'Ethan Engineer',
      role: Role.EMPLOYEE,
      managerId: mainUser.id,
      password: hashedPassword,
    },
  })

  const employee4 = await prisma.user.create({
    data: {
      email: 'fiona@company.com',
      name: 'Fiona Frontend',
      role: Role.EMPLOYEE,
      managerId: managerUser.id, // Reports to Bob
      password: hashedPassword,
    },
  })

  const employee5 = await prisma.user.create({
    data: {
      email: 'george@company.com',
      name: 'George Garcia',
      role: Role.EMPLOYEE,
      managerId: mainUser.id,
      password: hashedPassword,
    },
  })

  const employee6 = await prisma.user.create({
    data: {
      email: 'hannah@company.com',
      name: 'Hannah Hill',
      role: Role.EMPLOYEE,
      managerId: mainUser.id,
      password: hashedPassword,
    },
  })

  const allEmployees = [
    employeeUser,
    employee2,
    employee3,
    employee4,
    employee5,
    employee6,
  ]

  // Project A: Ongoing project (started Sep 2025, planned end Mar 2026)
  const projectA = await prisma.project.create({
    data: {
      name: 'Nuxt 3 Dashboard App',
      startDate: new Date('2025-09-01'),
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

  // Project B: Completed early (started Sep, planned Dec 15, ended Nov 20)
  const projectB = await prisma.project.create({
    data: {
      name: 'Legacy API Migration',
      startDate: new Date('2025-09-10'),
      endDate: new Date('2025-11-20'),
      plannedEndDate: new Date('2025-12-15'),
      ownerId: managerUser.id,
      userProjects: {
        create: [
          { userId: employeeUser.id },
          { userId: employee2.id },
          { userId: employee3.id },
          { userId: employee5.id },
        ],
      },
    },
  })

  // Project C: Completed late (started Oct, planned Nov 30, ended Dec 2)
  const projectC = await prisma.project.create({
    data: {
      name: 'Mobile App Backend',
      startDate: new Date('2025-10-01'),
      endDate: new Date('2025-12-02'),
      plannedEndDate: new Date('2025-11-30'),
      ownerId: mainUser.id,
      userProjects: {
        create: [
          { userId: employee4.id },
          { userId: employee5.id },
          { userId: employee6.id },
          { userId: managerUser.id },
        ],
      },
    },
  })

  // Project D: Ongoing (started Nov 2025)
  const projectD = await prisma.project.create({
    data: {
      name: 'E-commerce Platform Redesign',
      startDate: new Date('2025-11-01'),
      plannedEndDate: new Date('2026-02-28'),
      ownerId: managerUser.id,
      userProjects: {
        create: [
          { userId: employeeUser.id },
          { userId: employee2.id },
          { userId: employee4.id },
          { userId: employee6.id },
        ],
      },
    },
  })

  const mockProjectIds = [projectA.id, projectB.id, projectC.id, projectD.id]

  // ===== PROJECT A TASKS =====
  const taskA1 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: mainUser.id,
      assigneeId: employeeUser.id,
      name: 'Implement User Authentication',
      description: 'Set up OAuth2 and JWT authentication',
      isDone: true,
      projectId: projectA.id,
      dueDate: new Date('2025-09-30'),
    },
  })

  const taskA2 = await prisma.task.create({
    data: {
      type: TaskType.MEETING,
      creatorId: mainUser.id,
      assigneeId: managerUser.id,
      name: 'Weekly Sync Up',
      description: 'Review progress and blockages',
      isDone: false,
      projectId: projectA.id,
    },
  })

  const taskA3 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: mainUser.id,
      assigneeId: employee2.id,
      name: 'Design Database Schema',
      description: 'Create Prisma schema for core entities',
      isDone: true,
      projectId: projectA.id,
      dueDate: new Date('2025-09-20'),
    },
  })

  const taskA4 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employee4.id,
      name: 'Build Dashboard UI',
      description: 'Create responsive dashboard with Nuxt UI components',
      isDone: false,
      projectId: projectA.id,
      dueDate: new Date('2025-12-15'),
    },
  })

  const taskA5 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employee3.id,
      name: 'API Integration',
      description: 'Connect frontend to backend services',
      isDone: true,
      projectId: projectA.id,
      dueDate: new Date('2025-10-31'),
    },
  })

  const taskA6 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employeeUser.id,
      name: 'Write Unit Tests',
      description: 'Add test coverage for authentication module',
      isDone: true,
      projectId: projectA.id,
      dueDate: new Date('2025-10-15'),
    },
  })

  const taskA7 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employee3.id,
      name: 'Setup CI/CD Pipeline',
      description: 'Configure GitHub Actions for automated deployment',
      isDone: true,
      projectId: projectA.id,
      dueDate: new Date('2025-11-10'),
    },
  })

  const taskA8 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: mainUser.id,
      assigneeId: employee2.id,
      name: 'Performance Optimization',
      description: 'Optimize database queries and add caching',
      isDone: false,
      projectId: projectA.id,
      dueDate: new Date('2025-12-20'),
    },
  })

  // ===== PROJECT B TASKS =====
  const taskB1 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employee2.id,
      name: 'Database Migration Scripts',
      description: 'Write migration scripts for legacy data',
      isDone: true,
      projectId: projectB.id,
      dueDate: new Date('2025-10-01'),
    },
  })

  const taskB2 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employeeUser.id,
      name: 'API Endpoint Migration',
      description: 'Migrate REST endpoints to new architecture',
      isDone: true,
      projectId: projectB.id,
      dueDate: new Date('2025-10-15'),
    },
  })

  const taskB3 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employee3.id,
      name: 'Data Validation Layer',
      description: 'Implement input validation for migrated APIs',
      isDone: true,
      projectId: projectB.id,
      dueDate: new Date('2025-10-25'),
    },
  })

  const taskB4 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employee5.id,
      name: 'Integration Testing',
      description: 'Create comprehensive integration test suite',
      isDone: true,
      projectId: projectB.id,
      dueDate: new Date('2025-11-05'),
    },
  })

  const taskB5 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employee2.id,
      name: 'Documentation Update',
      description: 'Update API documentation for new endpoints',
      isDone: true,
      projectId: projectB.id,
      dueDate: new Date('2025-11-10'),
    },
  })

  const taskB6 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employeeUser.id,
      name: 'Performance Benchmarking',
      description: 'Compare old vs new API performance',
      isDone: true,
      projectId: projectB.id,
      dueDate: new Date('2025-11-15'),
    },
  })

  const taskB7 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employee3.id,
      name: 'Production Deployment',
      description: 'Deploy migrated APIs to production',
      isDone: true,
      projectId: projectB.id,
      dueDate: new Date('2025-11-20'),
    },
  })

  // ===== PROJECT C TASKS =====
  const taskC1 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: mainUser.id,
      assigneeId: employee4.id,
      name: 'Mobile API Design',
      description: 'Design RESTful API for mobile app',
      isDone: true,
      projectId: projectC.id,
      dueDate: new Date('2025-10-15'),
    },
  })

  const taskC2 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: mainUser.id,
      assigneeId: employee5.id,
      name: 'Authentication Service',
      description: 'Implement OAuth2 for mobile clients',
      isDone: true,
      projectId: projectC.id,
      dueDate: new Date('2025-10-25'),
    },
  })

  const taskC3 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: mainUser.id,
      assigneeId: employee6.id,
      name: 'Push Notification System',
      description: 'Set up Firebase Cloud Messaging',
      isDone: true,
      projectId: projectC.id,
      dueDate: new Date('2025-11-05'),
    },
  })

  const taskC4 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: mainUser.id,
      assigneeId: employee4.id,
      name: 'File Upload Service',
      description: 'Implement image and file upload endpoints',
      isDone: true,
      projectId: projectC.id,
      dueDate: new Date('2025-11-15'),
    },
  })

  const taskC5 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: mainUser.id,
      assigneeId: employee5.id,
      name: 'Real-time Sync',
      description: 'Implement WebSocket for real-time data sync',
      isDone: true,
      projectId: projectC.id,
      dueDate: new Date('2025-11-22'),
    },
  })

  const taskC6 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: mainUser.id,
      assigneeId: employee6.id,
      name: 'API Rate Limiting',
      description: 'Add rate limiting and throttling',
      isDone: true,
      projectId: projectC.id,
      dueDate: new Date('2025-11-28'),
    },
  })

  const taskC7 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: mainUser.id,
      assigneeId: managerUser.id,
      name: 'Load Testing',
      description: 'Perform load testing and optimization',
      isDone: true,
      projectId: projectC.id,
      dueDate: new Date('2025-12-02'),
    },
  })

  // ===== PROJECT D TASKS =====
  const taskD1 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employeeUser.id,
      name: 'E-commerce Architecture Planning',
      description: 'Design microservices architecture',
      isDone: true,
      projectId: projectD.id,
      dueDate: new Date('2025-11-15'),
    },
  })

  const taskD2 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employee2.id,
      name: 'Product Catalog Service',
      description: 'Build product management microservice',
      isDone: false,
      projectId: projectD.id,
      dueDate: new Date('2025-12-10'),
    },
  })

  const taskD3 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employee4.id,
      name: 'Shopping Cart Implementation',
      description: 'Implement cart with Redis caching',
      isDone: false,
      projectId: projectD.id,
      dueDate: new Date('2025-12-20'),
    },
  })

  const taskD4 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employee6.id,
      name: 'Payment Gateway Integration',
      description: 'Integrate Stripe payment processing',
      isDone: false,
      projectId: projectD.id,
      dueDate: new Date('2026-01-10'),
    },
  })

  const taskD5 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employeeUser.id,
      name: 'Order Management System',
      description: 'Build order processing workflow',
      isDone: false,
      projectId: projectD.id,
      dueDate: new Date('2026-01-20'),
    },
  })

  const taskD6 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employee2.id,
      name: 'Search Functionality',
      description: 'Implement Elasticsearch for product search',
      isDone: false,
      projectId: projectD.id,
      dueDate: new Date('2026-01-30'),
    },
  })

  const taskD7 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employee4.id,
      name: 'Admin Dashboard',
      description: 'Create admin panel for order management',
      isDone: false,
      projectId: projectD.id,
      dueDate: new Date('2026-02-15'),
    },
  })

  await prisma.meetingParticipant.createMany({
    data: [
      { meetingId: taskA2.id, userId: mainUser.id },
      { meetingId: taskA2.id, userId: managerUser.id },
      { meetingId: taskA2.id, userId: employeeUser.id },
    ],
  })

  // Create vacation requests
  const vacation1 = await prisma.task.create({
    data: {
      type: TaskType.VACATION,
      creatorId: employeeUser.id,
      name: 'Holiday Vacation',
      description: 'Two weeks off for family vacation',
      isDone: false,
      startDate: new Date('2025-12-23'),
      endDate: new Date('2026-01-06'),
    },
  })

  const vacation2 = await prisma.task.create({
    data: {
      type: TaskType.VACATION,
      creatorId: employee5.id,
      name: 'Conference Trip',
      description: 'Attending tech conference',
      isDone: false,
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-01-18'),
    },
  })

  // ===== GENERATE TIME ENTRIES PROGRAMMATICALLY =====
  console.info('Generating time entries...')

  const timeEntries: any[] = []
  const hoursVariations = [6, 6.5, 7, 7.5, 8, 8, 8, 8.5, 9] // Mostly 8 hours, some variation

  // Helper to generate time entries for a task
  const generateTimeEntries = (
    taskId: number,
    userId: number,
    startDate: Date,
    endDate: Date,
    minEntries: number = 7,
  ) => {
    const entries: any[] = []
    const currentDate = new Date(startDate)
    let entryCount = 0

    while (currentDate <= endDate && entryCount < 30) {
      // Max 30 entries per task
      // Skip weekends
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        const hours =
          hoursVariations[Math.floor(Math.random() * hoursVariations.length)]
        entries.push({
          taskId,
          userId,
          date: new Date(currentDate),
          hours,
          note: 'Work on assigned task',
        })
        entryCount++

        if (entryCount >= minEntries && Math.random() > 0.7) {
          break // Randomly stop after minimum entries met
        }
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return entries
  }

  // PROJECT A - September to December
  // TaskA1 - Authentication (employeeUser, then handed to employee3)
  timeEntries.push(
    ...generateTimeEntries(
      taskA1.id,
      employeeUser.id,
      new Date('2025-09-02'),
      new Date('2025-09-20'),
      10,
    ),
  )
  timeEntries.push(
    ...generateTimeEntries(
      taskA1.id,
      employee3.id,
      new Date('2025-09-23'),
      new Date('2025-09-30'),
      4,
    ),
  ) // Handover

  // TaskA3 - Database Schema (employee2)
  timeEntries.push(
    ...generateTimeEntries(
      taskA3.id,
      employee2.id,
      new Date('2025-09-02'),
      new Date('2025-09-18'),
      12,
    ),
  )

  // TaskA6 - Unit Tests (employeeUser)
  timeEntries.push(
    ...generateTimeEntries(
      taskA6.id,
      employeeUser.id,
      new Date('2025-10-01'),
      new Date('2025-10-14'),
      10,
    ),
  )

  // TaskA5 - API Integration (employee3)
  timeEntries.push(
    ...generateTimeEntries(
      taskA5.id,
      employee3.id,
      new Date('2025-10-15'),
      new Date('2025-10-30'),
      11,
    ),
  )

  // TaskA7 - CI/CD (employee3, then employee2)
  timeEntries.push(
    ...generateTimeEntries(
      taskA7.id,
      employee3.id,
      new Date('2025-10-28'),
      new Date('2025-11-05'),
      6,
    ),
  )
  timeEntries.push(
    ...generateTimeEntries(
      taskA7.id,
      employee2.id,
      new Date('2025-11-06'),
      new Date('2025-11-10'),
      3,
    ),
  ) // Handover

  // TaskA4 - Dashboard UI (employee4, ongoing)
  timeEntries.push(
    ...generateTimeEntries(
      taskA4.id,
      employee4.id,
      new Date('2025-11-11'),
      new Date('2025-12-02'),
      15,
    ),
  )

  // TaskA8 - Performance (employee2, ongoing)
  timeEntries.push(
    ...generateTimeEntries(
      taskA8.id,
      employee2.id,
      new Date('2025-11-25'),
      new Date('2025-12-02'),
      5,
    ),
  )

  // PROJECT B - September to November (completed early)
  // TaskB1 - Migration Scripts (employee2)
  timeEntries.push(
    ...generateTimeEntries(
      taskB1.id,
      employee2.id,
      new Date('2025-09-10'),
      new Date('2025-09-30'),
      15,
    ),
  )

  // TaskB2 - API Migration (employeeUser)
  timeEntries.push(
    ...generateTimeEntries(
      taskB2.id,
      employeeUser.id,
      new Date('2025-09-23'),
      new Date('2025-10-14'),
      15,
    ),
  )

  // TaskB3 - Validation (employee3)
  timeEntries.push(
    ...generateTimeEntries(
      taskB3.id,
      employee3.id,
      new Date('2025-10-08'),
      new Date('2025-10-24'),
      12,
    ),
  )

  // TaskB4 - Integration Testing (employee5)
  timeEntries.push(
    ...generateTimeEntries(
      taskB4.id,
      employee5.id,
      new Date('2025-10-15'),
      new Date('2025-11-04'),
      14,
    ),
  )

  // TaskB5 - Documentation (employee2)
  timeEntries.push(
    ...generateTimeEntries(
      taskB5.id,
      employee2.id,
      new Date('2025-10-28'),
      new Date('2025-11-08'),
      8,
    ),
  )

  // TaskB6 - Benchmarking (employeeUser)
  timeEntries.push(
    ...generateTimeEntries(
      taskB6.id,
      employeeUser.id,
      new Date('2025-11-04'),
      new Date('2025-11-14'),
      8,
    ),
  )

  // TaskB7 - Deployment (employee3)
  timeEntries.push(
    ...generateTimeEntries(
      taskB7.id,
      employee3.id,
      new Date('2025-11-11'),
      new Date('2025-11-20'),
      7,
    ),
  )

  // PROJECT C - October to December (completed late)
  // TaskC1 - API Design (employee4)
  timeEntries.push(
    ...generateTimeEntries(
      taskC1.id,
      employee4.id,
      new Date('2025-10-01'),
      new Date('2025-10-14'),
      10,
    ),
  )

  // TaskC2 - Auth Service (employee5)
  timeEntries.push(
    ...generateTimeEntries(
      taskC2.id,
      employee5.id,
      new Date('2025-10-07'),
      new Date('2025-10-24'),
      12,
    ),
  )

  // TaskC3 - Push Notifications (employee6)
  timeEntries.push(
    ...generateTimeEntries(
      taskC3.id,
      employee6.id,
      new Date('2025-10-21'),
      new Date('2025-11-04'),
      10,
    ),
  )

  // TaskC4 - File Upload (employee4, handed to employee6)
  timeEntries.push(
    ...generateTimeEntries(
      taskC4.id,
      employee4.id,
      new Date('2025-11-01'),
      new Date('2025-11-10'),
      7,
    ),
  )
  timeEntries.push(
    ...generateTimeEntries(
      taskC4.id,
      employee6.id,
      new Date('2025-11-11'),
      new Date('2025-11-15'),
      3,
    ),
  ) // Handover

  // TaskC5 - Real-time Sync (employee5)
  timeEntries.push(
    ...generateTimeEntries(
      taskC5.id,
      employee5.id,
      new Date('2025-11-08'),
      new Date('2025-11-21'),
      10,
    ),
  )

  // TaskC6 - Rate Limiting (employee6)
  timeEntries.push(
    ...generateTimeEntries(
      taskC6.id,
      employee6.id,
      new Date('2025-11-18'),
      new Date('2025-11-27'),
      7,
    ),
  )

  // TaskC7 - Load Testing (managerUser, then employee4)
  timeEntries.push(
    ...generateTimeEntries(
      taskC7.id,
      managerUser.id,
      new Date('2025-11-25'),
      new Date('2025-11-28'),
      3,
    ),
  )
  timeEntries.push(
    ...generateTimeEntries(
      taskC7.id,
      employee4.id,
      new Date('2025-11-29'),
      new Date('2025-12-02'),
      2,
    ),
  ) // Handover

  // PROJECT D - November to December (ongoing)
  // TaskD1 - Architecture (employeeUser)
  timeEntries.push(
    ...generateTimeEntries(
      taskD1.id,
      employeeUser.id,
      new Date('2025-11-01'),
      new Date('2025-11-14'),
      10,
    ),
  )

  // TaskD2 - Product Catalog (employee2, ongoing)
  timeEntries.push(
    ...generateTimeEntries(
      taskD2.id,
      employee2.id,
      new Date('2025-11-15'),
      new Date('2025-12-02'),
      12,
    ),
  )

  // TaskD3 - Shopping Cart (employee4, ongoing)
  timeEntries.push(
    ...generateTimeEntries(
      taskD3.id,
      employee4.id,
      new Date('2025-11-18'),
      new Date('2025-12-02'),
      10,
    ),
  )

  // Add some extra hours to ensure employees reach ~168 hours/month
  // Fill remaining days in November for employees
  const fillNovemberHours = (userId: number, taskId: number) => {
    for (let day = 1; day <= 30; day++) {
      const date = new Date('2025-11-01')
      date.setDate(day)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        // Check if this user already has an entry on this date
        const hasEntry = timeEntries.some(
          (e) =>
            e.userId === userId &&
            e.date.toDateString() === date.toDateString(),
        )
        if (!hasEntry) {
          timeEntries.push({
            taskId,
            userId,
            date: new Date(date),
            hours: 8,
            note: 'Work on assigned task',
          })
        }
      }
    }
  }

  // Fill September for some employees
  const fillSeptemberHours = (userId: number, taskId: number) => {
    for (let day = 1; day <= 30; day++) {
      const date = new Date('2025-09-01')
      date.setDate(day)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        const hasEntry = timeEntries.some(
          (e) =>
            e.userId === userId &&
            e.date.toDateString() === date.toDateString(),
        )
        if (!hasEntry) {
          timeEntries.push({
            taskId,
            userId,
            date: new Date(date),
            hours: 8,
            note: 'Work on assigned task',
          })
        }
      }
    }
  }

  // Fill October for some employees
  const fillOctoberHours = (userId: number, taskId: number) => {
    for (let day = 1; day <= 31; day++) {
      const date = new Date('2025-10-01')
      date.setDate(day)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        const hasEntry = timeEntries.some(
          (e) =>
            e.userId === userId &&
            e.date.toDateString() === date.toDateString(),
        )
        if (!hasEntry) {
          timeEntries.push({
            taskId,
            userId,
            date: new Date(date),
            hours: 8,
            note: 'Work on assigned task',
          })
        }
      }
    }
  }

  // Ensure all employees have ~168 hours for at least one month
  fillSeptemberHours(employee2.id, taskB1.id)
  fillOctoberHours(employeeUser.id, taskB2.id)
  fillOctoberHours(employee3.id, taskB3.id)
  fillOctoberHours(employee5.id, taskB4.id)
  fillNovemberHours(employee4.id, taskC1.id)
  fillNovemberHours(employee6.id, taskC6.id)

  // Insert all time entries
  console.info(`Creating ${timeEntries.length} time entries...`)
  await prisma.timeEntry.createMany({
    data: timeEntries,
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
