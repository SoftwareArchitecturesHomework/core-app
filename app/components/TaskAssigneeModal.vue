<script setup lang="ts">
import type { UserDropdownOption } from '~~/types/user-dropdown-option'

const isOpen = defineModel<boolean>({ default: false })

const props = defineProps<{
    taskId: number
    projectId: number | null
    currentAssigneeId: number | undefined
}>()

const emit = defineEmits<{
    assigneeUpdated: []
}>()

const isSubmitting = ref(false)
const toast = useToast()
const selectedUser = ref<UserDropdownOption | undefined>(undefined)

// Fetch project participants if task is associated with a project
const { data: projectParticipants } = await useFetch('/api/users', {
    query: computed(() =>
        props.projectId ? { projectId: props.projectId } : {},
    ),
    immediate: !!props.projectId,
})

function onCancel() {
    selectedUser.value = undefined
    isOpen.value = false
}

async function onSubmit() {
    if (!selectedUser.value) {
        toast.add({
            title: 'Validation Error',
            description: 'Please select a user',
            color: 'error',
        })
        return
    }

    isSubmitting.value = true

    try {
        await $fetch(`/api/tasks/${props.taskId}/assign`, {
            method: 'POST',
            body: { assigneeId: selectedUser.value.value },
        })

        toast.add({
            title: 'Success',
            description: 'Assignee updated successfully',
            color: 'primary',
        })

        selectedUser.value = undefined
        isOpen.value = false
        emit('assigneeUpdated')
    } catch (error: any) {
        console.error('Assign task error:', error)
        console.log(projectParticipants)
        const errorMessage = error?.data?.statusMessage || 'Failed to assign task'
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
    <UModal v-model:open="isOpen" size="md">
        <template #header>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Assign Task</h3>
        </template>

        <template #body>
            <div class="flex flex-col gap-4">
                <div v-if="!projectId" class="text-sm text-gray-600 dark:text-gray-400">
                    This task is not associated with a project. Only project tasks can be
                    assigned.
                </div>
                <div v-else class="space-y-2">
                    <label class="block text-sm font-medium">Select Assignee *</label>
                    <UserSearchDropdown v-model="selectedUser" :userOptions="projectParticipants || []" />
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton variant="soft" @click="onCancel" :disabled="isSubmitting">Cancel</UButton>
                <UButton color="primary" @click="onSubmit" :loading="isSubmitting"
                    :disabled="isSubmitting || !projectId">
                    Assign
                </UButton>
            </div>
        </template>
    </UModal>
</template>
