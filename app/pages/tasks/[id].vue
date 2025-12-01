<script setup lang="ts">
import type { TaskType } from '~~/.generated/prisma/client'
const route = useRoute()
const {
  data: task,
  error,
  pending,
  refresh,
} = await useFetch(`/api/tasks/${route.params.id}`)
useHead({
  title: () => (task.value ? `${task.value.name} Task` : 'Task Details'),
})
const { user } = useUser()
const timeEntryModalOpen = ref(false)
const assigneeModalOpen = ref(false)

const isCreator = computed(() => task.value?.creatorId === user.value?.id)
const isAssignee = computed(() => task.value?.assigneeId === user.value?.id)

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getTaskTypeColor(
  type: TaskType,
):
  | 'error'
  | 'info'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'neutral' {
  switch (type) {
    case 'MEETING':
      return 'secondary'
    case 'TASK':
      return 'primary'
    default:
      return 'neutral'
  }
}

function getTaskTypeLabel(type: TaskType) {
  switch (type) {
    case 'MEETING':
      return 'Meeting'
    case 'TASK':
      return 'Task'
    default:
      return type
  }
}

async function toggleTaskStatus() {
  if (!task.value) return

  try {
    await $fetch(`/api/tasks/${task.value.id}/toggle`, {
      method: 'POST',
    })
    await refresh()
  } catch (error) {
    console.error('Failed to toggle task status:', error)
  }
}

async function deleteTask() {
  if (!task.value) return

  if (
    !confirm(
      'Are you sure you want to delete this task? This action cannot be undone.',
    )
  ) {
    return
  }

  try {
    await $fetch(`/api/tasks/${task.value.id}`, {
      method: 'DELETE',
    })
    alert('Task deleted successfully.')
    navigateTo(`/projects/${task.value.projectId}`)
  } catch (error) {
    console.error('Failed to delete task:', error)
    alert('Failed to delete task. Please try again.')
  }
}

function openTimeEntryModal() {
  if (!isAssignee.value) return
  timeEntryModalOpen.value = true
}

function openAssigneeModal() {
  if (!isCreator.value) return
  assigneeModalOpen.value = true
}
async function removeAssignee() {
  if (!task.value) return

  try {
    await $fetch(`/api/tasks/${task.value.id}/assign`, {
      method: 'POST',
      body: { assigneeId: null },
    })
    await refresh()
  } catch (error) {
    console.error('Failed to remove assignee:', error)
  }
}

async function removeTimeEntry(id: number) {
  if (!task.value) return

  try {
    await $fetch(`/api/time-entries/${id}`, {
      method: 'DELETE',
    })
    await refresh()
  } catch (error) {
    console.error('Failed to remove time entry:', error)
  }
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Loading State -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-8 h-8 animate-spin text-primary"
      />
    </div>

    <!-- Error State -->
    <UCard v-else-if="error">
      <div class="text-center py-12">
        <UIcon
          name="i-heroicons-exclamation-triangle"
          class="w-16 h-16 mx-auto text-red-500 mb-4"
        />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
          >Error Loading Task</h3
        >
        <p class="text-gray-600 dark:text-gray-400"
          >{{ error.statusMessage || 'Failed to load task details' }}
        </p>
        <UButton class="mt-4" @click="$router.back()"> Go Back </UButton>
      </div>
    </UCard>

    <!-- Task Details -->
    <div v-else-if="task">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-3 mb-2">
          <UBadge :color="getTaskTypeColor(task.type)" variant="soft" size="xl">
            {{ getTaskTypeLabel(task.type) }}
          </UBadge>
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white">
            {{ task.name || 'Untitled Task' }}
          </h1>
          <UButton
            v-if="isCreator"
            color="error"
            variant="soft"
            class="ml-auto"
            @click="deleteTask"
          >
            <UIcon name="i-heroicons-trash" class="w-5 h-5" />
            Delete task
          </UButton>
        </div>
      </div>

      <!-- Two Column Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column - Main Content (2/3 width) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Description -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-heroicons-document-text"
                  class="w-5 h-5 text-primary"
                />
                <h2 class="text-xl font-semibold">Description</h2>
              </div>
            </template>
            <p class="text-gray-900 dark:text-white whitespace-pre-wrap">
              {{ task.description || 'No description provided' }}</p
            >
          </UCard>

          <!-- Time Entries Card -->
          <UCard v-if="task.type === 'TASK'">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-heroicons-clock"
                    class="w-5 h-5 text-primary"
                  />
                  <h2 class="text-xl font-semibold">Time Entries</h2>
                  <UBadge color="secondary" variant="soft">{{
                    task.timeEntries.length
                  }}</UBadge>
                </div>
                <UButton
                  icon="i-heroicons-plus"
                  size="sm"
                  color="primary"
                  variant="soft"
                  @click="openTimeEntryModal"
                  v-if="isAssignee"
                >
                  Add Time Entry
                </UButton>
              </div>
            </template>

            <div
              v-if="task.timeEntries.length > 0"
              class="divide-y divide-gray-200 dark:divide-gray-800"
            >
              <div
                v-for="entry in task.timeEntries"
                :key="entry.id"
                class="py-4 first:pt-0 last:pb-0"
              >
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-3">
                    <UAvatar
                      :src="entry.user.image || undefined"
                      :alt="entry.user.name || 'User'"
                      size="sm"
                    />
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white"
                        >{{ entry.user.name }}
                      </p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">{{
                        formatDate(entry.date)
                      }}</p>
                      <p
                        v-if="entry.note"
                        class="text-sm text-gray-600 dark:text-gray-400 mt-1"
                      >
                        {{ entry.note }}</p
                      >
                    </div>
                  </div>
                  <div class="flex gap-4">
                    <UBadge color="primary" variant="soft"
                      >{{ entry.hours }}h</UBadge
                    >
                    <UButton
                      v-if="isAssignee && entry.userId === user?.id"
                      color="error"
                      variant="ghost"
                      size="xs"
                      circular
                      @click="removeTimeEntry(entry.id)"
                    >
                      <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                    </UButton>
                    <div v-else class="h-8 w-8"></div>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-else
              class="text-center py-8 text-gray-500 dark:text-gray-400"
            >
              No time entries yet
            </div>
          </UCard>
        </div>

        <div class="lg:col-span-1 space-y-4">
          <UCard v-if="task.project">
            <template #header>
              <h3 class="font-semibold">Project</h3>
            </template>
            <NuxtLink
              :to="`/projects/${task.project.id}`"
              class="flex items-center gap-2 text-primary hover:underline"
            >
              <UIcon name="i-heroicons-folder" class="w-5 h-5 shrink-0" />
              <span class="truncate">{{ task.project.name }}</span>
            </NuxtLink>
          </UCard>
          <UCard v-if="task.type === 'TASK'">
            <template #header>
              <h3 class="font-semibold">Status</h3>
            </template>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400"
                  >Current Status</span
                >
                <UBadge v-if="task.isDone" color="success" variant="soft">
                  <UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
                  Completed
                </UBadge>
                <UBadge v-else color="info" variant="soft">
                  <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                  In Progress
                </UBadge>
              </div>
              <UButton
                v-if="isAssignee"
                :color="task.isDone ? 'info' : 'primary'"
                block
                variant="ghost"
                @click="toggleTaskStatus"
              >
                <UIcon
                  :name="
                    task.isDone ? 'i-heroicons-arrow-path' : 'i-heroicons-check'
                  "
                  class="w-4 h-4"
                />
                {{ task.isDone ? 'Reopen Task' : 'Mark Complete' }}
              </UButton>
            </div>
          </UCard>

          <!-- People Card -->
          <UCard>
            <template #header>
              <h3 class="font-semibold">People</h3>
            </template>
            <div class="space-y-4">
              <!-- Creator -->
              <div>
                <label
                  class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide"
                  >Creator</label
                >
                <div class="flex items-center gap-2 mt-2">
                  <UAvatar
                    :src="task.creator.image || undefined"
                    :alt="task.creator.name || 'User'"
                    size="sm"
                  />
                  <div class="flex-1 min-w-0">
                    <p
                      class="font-medium text-sm text-gray-900 dark:text-white truncate"
                      >{{ task.creator.name }}
                    </p>
                    <p
                      class="text-xs text-gray-600 dark:text-gray-400 truncate"
                      >{{ task.creator.email }}</p
                    >
                  </div>
                </div>
              </div>

              <!-- Assignee -->
              <div v-if="task.type === 'TASK'">
                <label
                  class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide"
                  >Assignee</label
                >
                <div
                  @click="openAssigneeModal"
                  class="cursor-pointer"
                  :class="{ group: isCreator }"
                >
                  <div
                    class="flex items-center gap-2 mt-2 p-2 rounded-lg transition-colors group-hover:bg-gray-100 dark:group-hover:bg-gray-800"
                  >
                    <UAvatar
                      :src="task.assignee?.image || undefined"
                      :alt="task.assignee?.name || 'User'"
                      size="sm"
                    />
                    <div class="flex-1 min-w-0">
                      <p
                        class="font-medium text-sm text-gray-900 dark:text-white truncate"
                        >{{ task.assignee?.name || 'Unassigned' }}
                      </p>
                      <p
                        v-if="task.assignee"
                        class="text-xs text-gray-600 dark:text-gray-400 truncate"
                        >{{ task.assignee.email }}</p
                      >
                    </div>
                    <UButton
                      v-if="isCreator && task.assignee"
                      color="error"
                      variant="ghost"
                      size="xs"
                      icon="i-heroicons-x-mark"
                      class="shrink-0"
                      @click.stop="removeAssignee"
                    />
                  </div>
                </div>
              </div>
              <div
                v-if="task.type === 'MEETING'"
                @click="openAssigneeModal"
                class="cursor-pointer"
              >
                <label
                  class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide"
                  >Participants</label
                >
                <div
                  v-if="
                    task.meetingParticipants &&
                    task.meetingParticipants.length > 0
                  "
                >
                  <div
                    v-for="participant in task.meetingParticipants"
                    :key="participant.id"
                    class="flex items-center gap-2 mt-2 p-2 rounded-lg transition-colors"
                  >
                    <UAvatar
                      :src="participant.user.image || undefined"
                      :alt="participant.user.name || 'User'"
                      size="sm"
                    />
                    <div class="flex-1 min-w-0">
                      <p
                        class="font-medium text-sm text-gray-900 dark:text-white truncate"
                        >{{ participant.user.name }}
                      </p>
                      <p
                        class="text-xs text-gray-600 dark:text-gray-400 truncate"
                        >{{ participant.user.email }}
                      </p>
                    </div>
                  </div>
                </div>
                <div v-else>
                  <p class="text-sm text-gray-400"
                    >No participants added yet.</p
                  >
                </div>
                <div class="mt-2 flex justify-center">
                  <UButton variant="ghost" size="sm" block color="info">
                    <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                    Add Participants
                  </UButton>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
      <AddTimeEntryModal
        v-model="timeEntryModalOpen"
        :taskId="task?.id"
        @timeEntryAdded="refresh"
      />
      <TaskAssigneeModal
        v-model="assigneeModalOpen"
        :taskId="task?.id"
        :projectId="task?.projectId"
        :currentAssigneeId="task?.assignee?.id"
        @assigneeUpdated="refresh"
      />
    </div>
  </div>
</template>
