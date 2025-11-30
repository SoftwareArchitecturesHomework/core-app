import { getServerSession } from '#auth'
import { prisma } from '~~/server/utils/prisma'
import {TaskCreationDto} from "~~/types/task-creation-dto";
import {$Enums} from "~/generated/prisma/client";
import TaskType = $Enums.TaskType;


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

    const body = (await readBody(event)) as TaskCreationDto

    const { type, name, description, projectName,startDate, endDate } = body

    if (!type || !startDate || !endDate) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Type, start date and end date are required'
        })
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (endDateObj <= startDateObj) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Eend date must be after start date'
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


    try {
        const task = await prisma.task.create({
            data: {
                type: taskType,
                name: name,
                startDate: startDateObj,
                endDate: endDateObj,
                description: description,
                isDone: false,
                creatorId: user.id,
                assigneeId: user.id,
            }
        })

        return task
    } catch (error) {
        console.error('Error creating task:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create task'
        })
    }
})