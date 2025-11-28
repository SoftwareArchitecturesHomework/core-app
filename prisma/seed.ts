import { PrismaClient, Role, TaskType } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  await prisma.timeEntry.deleteMany();
  await prisma.task.deleteMany();
  await prisma.userProject.deleteMany();
  await prisma.project.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
}

async function seed() {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setMonth(today.getMonth() + 3);

  console.log(' Starting database seed...');

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      name: 'Alice Admin',
      role: Role.ADMIN,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@company.com',
      name: 'Bob Manager',
      role: Role.MANAGER,
      managerId: adminUser.id,
    },
  });

  const employeeUser = await prisma.user.create({
    data: {
      email: 'employee@company.com',
      name: 'Charlie Employee',
      role: Role.EMPLOYEE,
      managerId: managerUser.id,
    },
  });

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
  });

  const projectB = await prisma.project.create({
    data: {
      name: 'Legacy API Migration (Completed)',
      startDate: today,
      endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 45),
      plannedEndDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 60),
      ownerId: managerUser.id,
      userProjects: {
        create: [
          { userId: employeeUser.id },
        ],
      },
    },
  });

  const task1 = await prisma.task.create({
    data: {
      type: TaskType.TASK,
      creatorId: managerUser.id,
      assigneeId: employeeUser.id,
      name: 'Implement User Authentication',
      isDone: true,
      projectId: projectA.id,
    },
  });

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
  });

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
  });

  console.log('Seeding finished.');
}

export { cleanup, seed };