<script setup lang="ts">
import { reactive } from 'vue'

const props = defineProps<{
  projectId: number
  participants: Array<{
    userId: number
    user: { id: number; name: string | null }
  }>
}>()

const emit = defineEmits<{
  taskAdded: []
}>()

const newTask = reactive({
  name: '',
  description: '',
  assigneeId: null as number | null,
})
const { data: projectParticipants } = await useFetch('/api/users', {
  query: computed(() =>
    props.projectId ? { projectId: props.projectId } : {},
  ),
  immediate: !!props.projectId,
})

const isSubmitting = ref(false)
const isOpen = ref(false)
const toast = useToast()

function resetForm() {
  newTask.name = ''
  newTask.description = ''
  newTask.assigneeId = null
}

function onCancel() {
  resetForm()
  isOpen.value = false
}

async function onSubmit() {
  if (!newTask.name) {
    toast.add({
      title: 'Validation Error',
      description: 'Task name is required',
      color: 'error',
    })
    return
  }

  isSubmitting.value = true

  try {
    await $fetch(`/api/projects/${props.projectId}/tasks`, {
      method: 'POST',
      body: {
        name: newTask.name,
        description: newTask.description || null,
        type: 'TASK',
        assigneeId: newTask.assigneeId,
      },
    })

    toast.add({
      title: 'Success',
      description: 'Task created successfully',
      color: 'primary',
    })

    resetForm()
    emit('taskAdded')
    isOpen.value = false
  } catch (error: any) {
    console.error('Task creation error:', error)
    const errorMessage = error?.data?.statusMessage || 'Failed to create task'
    toast.add({
      title: 'Error',
      description: errorMessage,
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal v-model:open="isOpen">
    <UButton icon="i-heroicons-plus" size="sm" color="primary" variant="soft">
      Add Task
    </UButton>

    <template #title>
      <h2 class="text-lg font-semibold">New Task</h2>
    </template>

    <template #body>
      <div class="flex flex-col gap-4">
        <div class="space-y-2">
          <label class="block text-sm font-medium">Task Name *</label>
          <UInput
            v-model="newTask.name"
            placeholder="Enter task name"
            class="w-full"
          />
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium w-full">Description</label>
          <UTextarea
            v-model="newTask.description"
            placeholder="Enter task description"
            class="w-full"
          />
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium">Assignee</label>
          <UserSearchDropdown
            @update:modelValue="newTask.assigneeId = $event?.value || null"
            :userOptions="projectParticipants || []"
          />
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <UButton type="button" variant="ghost" @click="onCancel"
            >Cancel</UButton
          >
          <UButton
            type="button"
            color="primary"
            @click="onSubmit"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          >
            Create
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
