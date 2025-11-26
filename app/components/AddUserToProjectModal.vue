<script setup lang="ts">
const props = defineProps<{
    projectId: number
}>()

const emit = defineEmits<{
    participantAdded: []
}>()

const isSubmitting = ref(false)
const isOpen = defineModel<boolean>({ default: false })
const toast = useToast()
const selectedUser = ref<{ label: string; value: number } | undefined>(undefined)

const { data: availableUsers } = await useFetch('/api/users', {
    query: {
        excludeProjectId: props.projectId
    }
})

const userOptions = computed(() => {
    return availableUsers.value?.map(user => ({
        label: `${user.name} (${user.email})`,
        value: user.id
    })) || []
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
            color: 'error'
        })
        return
    }

    isSubmitting.value = true

    try {
        await $fetch(`/api/projects/${props.projectId}/participants`, {
            method: 'POST',
            body: { userId: selectedUser.value.value }
        })

        toast.add({
            title: 'Success',
            description: 'Participant added successfully',
            color: 'primary'
        })

        selectedUser.value = undefined
        isOpen.value = false
        emit('participantAdded')
    } catch (error: any) {
        console.error('Add participant error:', error)
        const errorMessage = error?.data?.statusMessage || 'Failed to add participant'
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
        <UButton icon="i-heroicons-plus" size="sm" color="primary" variant="soft" @click="isOpen = true">
            Add Participant
        </UButton>

        <template #title>
            <h2 class="text-lg font-semibold">Add Participant</h2>
        </template>

        <template #body>
            <div class="flex flex-col gap-4">
                <div class="space-y-2">
                    <label class="block text-sm font-medium">Select User *</label>
                    <USelectMenu v-model="selectedUser" :items="userOptions" placeholder="Search for a user..."
                        searchable class="w-full" />
                </div>

                <div class="flex justify-end gap-2 pt-4">
                    <UButton type="button" variant="ghost" @click="onCancel">Cancel</UButton>
                    <UButton type="button" color="primary" @click="onSubmit" :loading="isSubmitting"
                        :disabled="isSubmitting">
                        Add
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>
</template>