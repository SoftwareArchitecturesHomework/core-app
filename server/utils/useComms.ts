import { H3Event } from 'h3'
import type { Project, Task, User as U } from '~~/.generated/prisma/client'

function createComms() {
  type User = Pick<U, 'email' | 'name'>
  const COMMS_URL = useRuntimeConfig().commsAPIUrl

  async function $post<R>(body: any, endpoint: string, event: H3Event) {
    return $fetch<R>(`${COMMS_URL}/api/notifications/${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await useJwt(event)}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body,
    })
  }

  function remapTask(task: Task) {
    return {
      id: task.id,
      name: task.name,
      description: task.description,
      start: task.startDate?.getTime(),
      end: task.endDate?.getTime(),
    }
  }

  function sendAddedToProjectNotification(
    event: H3Event,
    manager: User,
    member: User,
    project: Project,
  ) {
    return $post<{ success: boolean }>(
      { manager, member, project },
      'user-added',
      event,
    )
  }

  function sendUserRemovedFromProjectNotification(
    event: H3Event,
    manager: User,
    member: User,
    project: Project,
  ) {
    return $post<{ success: boolean }>(
      { manager, member, project },
      'user-removed',
      event,
    )
  }

  function sendProjectCompletedNotification(
    event: H3Event,
    manager: User,
    members: User[],
    project: Project,
  ) {
    return $post<{ success: boolean }>(
      { manager, members, project },
      'project-completed',
      event,
    )
  }

  function sendTaskAssignment(
    event: H3Event,
    assigner: User,
    assignee: User,
    task: Task,
  ) {
    return $post<{ success: boolean }>(
      { assigner, assignee, task: remapTask(task) },
      'task-assigned',
      event,
    )
  }

  function sendTaskCompletion(event: H3Event, assignee: User, task: Task) {
    return $post<{ success: boolean }>(
      { assignee, task: remapTask(task) },
      'task-completed',
      event,
    )
  }

  function sendVacationRequest(
    event: H3Event,
    assigner: User,
    assignee: User,
    task: Task,
  ) {
    return $post<{ success: boolean }>(
      { assigner, assignee, task: remapTask(task) },
      'vacation-request',
      event,
    )
  }

  return {
    sendAddedToProjectNotification,
    sendUserRemovedFromProjectNotification,
    sendProjectCompletedNotification,
    sendTaskAssignment,
    sendTaskCompletion,
    sendVacationRequest,
  }
}

let comms: ReturnType<typeof createComms> | undefined = undefined
export function useComms() {
  if (!comms) {
    comms = createComms()
  }
  return comms
}
