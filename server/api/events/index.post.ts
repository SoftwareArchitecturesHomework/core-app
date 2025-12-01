import { getServerSession } from '#auth'
import { prisma } from '~~/server/utils/prisma'
import {EventCreationDto} from "~~/types/event-creation-dto";
import { $Enums, type Task } from '~~/.generated/prisma/client'
import TaskType = $Enums.TaskType;
import type { User } from '~~/.generated/prisma/client'


export default defineEventHandler(async (event) => {
    const session = await getServerSession(event)
    const user = session?.user

    console.log('Session:', JSON.stringify(session, null, 2))
    console.log('User:', session?.user)

    if (!session?.user || !user?.id) {
        console.error(
            'Unauthorized - session.user:',
            session?.user,
            'user.id:',
            user?.id,
        )
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        })
    }

    const body = (await readBody(event)) as EventCreationDto

    const { type, name, description, projectId,startDate, endDate, participantIds, taskId } = body

    if (!type || !startDate || !endDate) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Type, start date and end date are required'
        })
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);


    if (endDateObj < startDateObj) {
        throw createError({
            statusCode: 400,
            statusMessage: 'End date must be after start date'
        })
    }

    const taskTypeString = type.toUpperCase();
    if (!Object.values(TaskType).includes(taskTypeString as TaskType)) {
        console.error(`Invalid TaskType received: ${type}`);
        throw createError({
            statusCode: 400,
            statusMessage: `Invalid task type provided: ${type}. Must be one of ${Object.values(TaskType).join(', ')}.`
        });
    }

    const taskType = taskTypeString as TaskType;

    const userConnects = participantIds.map(userId => ({
      userId: userId
    }));


    try {
        let task;
        const taskData = {
          type: taskType,
          name: name,
          projectId: projectId,
          startDate: startDateObj,
          endDate: endDateObj,
          description: description,
          isDone: false,
          creatorId: user.id,
          assigneeId: null,
        }
        if(taskId){
          task = await prisma.task.update({
            where: { id: taskId },
            data: taskData
          });

          await prisma.meetingParticipant.deleteMany({
            where: { meetingId: taskId }
          });

          if (participantIds.length > 0) {
            await prisma.meetingParticipant.createMany({
              data: userConnects.map(user => ({
                meetingId: taskId,
                userId: user.userId
              })),
              skipDuplicates: true
            });
          }
          console.log(`Task ${taskId} updated successfully.`);
        }
        else{
          task = await prisma.task.create({
            data: {
              ...taskData,
              meetingParticipants: {
                createMany: {
                  data: userConnects.map(user => ({ userId: user.userId })),
                  skipDuplicates: true
                }
              }
            }
          })

          const userWithManager = await prisma.user.findUnique({
            where: {
              id: user.id,
            },
            include: {
              manager: true
            },
          });
          const manager = userWithManager?.manager
          await useComms().sendVacationRequest(
            event,
            user as User,
            manager as User,
            task as Task
          )

          console.log('New Task created successfully.');
        }
        return task
    } catch (error) {
        console.error('Error creating task:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create task'
        })
    }
})