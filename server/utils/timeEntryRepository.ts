export async function createTimeEntry(
  taskId: number,
  userId: number,
  date: Date,
  hours: number,
  note: string | null,
) {
  return await prisma.timeEntry.create({
    data: {
      taskId: taskId,
      userId: userId,
      date: date,
      hours: hours,
      note: note || null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      task: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  })
}

export async function getTimeEntryById(id: number) {
  return await prisma.timeEntry.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      taskId: true,
      date: true,
      hours: true,
      note: true,
    },
  })
}

export async function deleteTimeEntry(id: number) {
  return await prisma.timeEntry.delete({
    where: { id },
  })
}
