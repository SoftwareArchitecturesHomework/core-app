import { H3Event } from 'h3'
import type { Task } from '~~/.generated/prisma/client'

function createComms() {
  const COMMS_URL = useRuntimeConfig().commsAPIUrl

  async function $post<R>(body: any, endpoint: string, event: H3Event) {
    const jwt = await useJwt(event)
    return $fetch<R>(`${COMMS_URL}/api/${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body,
    })
  }

  function sendProjectJoinNotification(
    event: H3Event,
    to: string[],
    projectName: string,
  ) {
    return $post<{ success: boolean }>(
      { to, projectName },
      'email/project-join',
      event,
    )
  }

  function sendTaskAssignment(event: H3Event, to: string[], taskDetails: Task) {
    return $post<{ success: boolean }>(
      { to, taskDetails },
      'email/task-assignment',
      event,
    )
  }

  return {
    sendProjectJoinNotification,
    sendTaskAssignment,
  }
}

let comms: ReturnType<typeof createComms> | undefined = undefined
export function useComms() {
  if (!comms) {
    comms = createComms()
  }
  return comms
}
