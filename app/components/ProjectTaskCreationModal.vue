<script setup lang="ts">
import { reactive, shallowRef } from 'vue'
import { getLocalTimeZone, today } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'

const props = defineProps<{
    projectId: number
    participants: Array<{ userId: number; user: { id: number; name: string | null } }>
}>()

const emit = defineEmits<{
    taskAdded: []
}>()

const newTask = reactive({
    name: '',
    description: '',
    assigneeId: null as number | null
})

const dueDate = shallowRef<DateValue | null>(null)
const isSubmitting = ref(false)
const isOpen = ref(false)
const toast = useToast()

const assigneeOptions = computed(() => {
    console.log(props.participants)
    return props.participants.map(p => ({
        label: p.user.name || 'Unknown User',
        value: p.userId
    }))
})

const selectedAssignee = computed({
    get: () => assigneeOptions.value.find(option => option.value === newTask.assigneeId),
    set: (option) => {
        newTask.assigneeId = option?.value ?? null
    }
})

function resetForm() {
    newTask.name = ''
    newTask.description = ''
    newTask.assigneeId = null
    dueDate.value = null
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
            color: 'error'
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
                type: "TASK",
                assigneeId: newTask.assigneeId
            }
        })

        toast.add({
            title: 'Success',
            description: 'Task created successfully',
            color: 'primary'
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
            color: 'error'
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
                    <UInput v-model="newTask.name" placeholder="Enter task name" class="w-full" />
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium w-full">Description</label>
                    <UTextarea v-model="newTask.description" placeholder="Enter task description" class="w-full" />
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium">Assignee</label>
                    <USelectMenu v-model="selectedAssignee" :items="assigneeOptions"
                        placeholder="Select assignee (optional)" value-attribute="value" option-attribute="label"
                        class="w-full" />
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium">Due Date</label>
                    <UPopover>
                        <UButton variant="outline" class="w-full justify-start">
                            {{ dueDate ? dueDate.toString() : 'Not set' }}
                        </UButton>

                        <template #content>
                            <UCalendar v-model="dueDate" class="w-auto" />
                        </template>
                    </UPopover>
                </div>

                <div class="flex justify-end gap-2 pt-4">
                    <UButton type="button" variant="ghost" @click="onCancel">Cancel</UButton>
                    <UButton type="button" color="primary" @click="onSubmit" :loading="isSubmitting"
                        :disabled="isSubmitting">
                        Create
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>
</template>