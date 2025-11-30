<script setup lang="ts">
const route = useRoute()
const projectId = route.params.id
const { data: session } = useAuth()

const user = computed(() => session.value?.user)

const {
    data: project,
    error,
    pending,
    refresh,
} = await useFetch(`/api/projects/${projectId}`)
useHead({ title: () => (project.value ? project.value.name : '') })

const isOwner = computed(() => project.value?.ownerId === user.value?.id)
const projectCloseable = computed(() => {
    if (!project.value) return false
    const now = new Date()
    const start = new Date(project.value.startDate)
    return start <= now
})

async function onParticipantAdded() {
    await refresh()
}

async function onTaskAdded() {
    await refresh()
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

const statusColorsMap: Record<string, 'primary' | 'secondary' | 'error'> = {
    Ongoing: 'primary',
    Completed: 'secondary',
    Overdue: 'error',
}

const statusLables = computed(() => {
    const labels = []
    if (!project.value?.endDate) labels.push('Ongoing')
    else labels.push('Completed')
    if (project.value?.plannedEndDate) {
        const plannedEnd = new Date(project.value.plannedEndDate)
        const now = new Date()
        if (plannedEnd < now) {
            labels.push('Overdue')
        }
    }
    return labels
})

function getTaskTypeColor(
    type: string,
):
    | 'error'
    | 'info'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'neutral' {
    switch (type) {
        case 'VACATION':
            return 'warning'
        case 'MEETING':
            return 'info'
        case 'TASK':
            return 'primary'
        case 'INDIVIDUALTASK':
            return 'success'
        default:
            return 'neutral'
    }
}

function getTaskTypeLabel(type: string) {
    switch (type) {
        case 'VACATION':
            return 'Vacation'
        case 'MEETING':
            return 'Meeting'
        case 'TASK':
            return 'Task'
        case 'INDIVIDUALTASK':
            return 'Individual Task'
        default:
            return type
    }
}

function closeProject() {
    $fetch(`/api/projects/${projectId}/close`, {
        method: 'POST',
    })
        .then(() => {
            refresh()
        })
        .catch((error) => {
            console.error('Close project error:', error)
            const toast = useToast()
            toast.add({
                title: 'Error',
                description: 'Failed to close project',
                color: 'error'
            })
        })
}

function removeParticipant(userId: number) {
    $fetch(`/api/projects/${projectId}/participants/${userId}`, {
        method: 'DELETE',
    })
        .then(() => {
            refresh()
        })
        .catch((error) => {
            console.error('Remove participant error:', error)
            const toast = useToast()
            toast.add({
                title: 'Error',
                description: 'Failed to remove participant',
                color: 'error'
            })
        })
}
</script>

<template>
    <div class="p-6 max-w-7xl mx-auto">
        <!-- Loading State -->
        <div v-if="pending" class="flex items-center justify-center py-12">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
        </div>

        <!-- Error State -->
        <UCard v-else-if="error">
            <div class="text-center py-12">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 mx-auto text-red-500 mb-4" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading Project</h3>
                <p class="text-gray-600 dark:text-gray-400">{{
                    error.statusMessage || 'Failed to load project details'
                }}</p>
                <UButton class="mt-4" to="/projects"> Back to Projects </UButton>
            </div>
        </UCard>

        <!-- Project Details -->
        <div v-else-if="project" class="space-y-6">
            <!-- Header -->
            <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                    <div>
                        <h1 class="text-4xl font-bold text-gray-900 dark:text-white">{{
                            project.name
                        }}</h1>
                    </div>
                    <UBadge v-for="label in statusLables" :key="label" :color="statusColorsMap[label]" variant="soft"
                        size="lg">
                        {{ label }}
                    </UBadge>
                </div>
                <UButton v-if="isOwner && projectCloseable" variant="soft" @click="closeProject()">
                    End project
                </UButton>
            </div>

            <!-- Project Info Card -->
            <UCard>
                <template #header>
                    <div class="flex items-center gap-2">
                        <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-primary" />
                        <h2 class="text-xl font-semibold">Project Information</h2>
                    </div>
                </template>

                <div class="grid grid-cols-1 md:grid-cols-2 [.has-end-date]:md:grid-cols-3 gap-6"
                    :class="{ 'has-end-date': project.endDate }">
                    <div>
                        <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Start Date</label>
                        <div class="flex items-center gap-2 mt-1">
                            <UIcon name="i-heroicons-calendar" class="w-5 h-5 text-gray-500" />
                            <span class="text-gray-900 dark:text-white">{{
                                formatDate(project.startDate)
                            }}</span>
                        </div>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Planned End Date</label>
                        <div class="flex items-center gap-2 mt-1">
                            <UIcon name="i-heroicons-calendar-days" class="w-5 h-5 text-gray-500" />
                            <span class="text-gray-900 dark:text-white">
                                {{
                                    project.plannedEndDate
                                        ? formatDate(project.plannedEndDate)
                                        : 'Not set'
                                }}
                            </span>
                        </div>
                    </div>
                    <div v-if="project.endDate">
                        <label class="text-sm font-medium text-gray-600 dark:text-gray-400">End Date</label>
                        <div class="flex items-center gap-2 mt-1">
                            <UIcon name="i-heroicons-calendar-days" class="w-5 h-5 text-gray-500" />
                            <span class="text-gray-900 dark:text-white">
                                {{ formatDate(project.endDate) }}
                            </span>
                        </div>
                    </div>
                </div>
            </UCard>

            <!-- Owner Card -->
            <UCard>
                <template #header>
                    <div class="flex items-center gap-2">
                        <UIcon name="i-heroicons-user-circle" class="w-5 h-5 text-primary" />
                        <h2 class="text-xl font-semibold">Project Owner</h2>
                    </div>
                </template>

                <div class="flex items-center gap-4">
                    <UAvatar :src="project.owner.image || undefined" :alt="project.owner.name || 'User'" size="lg" />
                    <div>
                        <div class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">{{
                            project.owner.name }}
                            <UBadge color="primary" variant="soft" size="sm" class="ml-auto">You</UBadge>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">{{
                            project.owner.email
                        }}</p>
                    </div>
                </div>
            </UCard>

            <!-- Participants Card -->
            <UCard>
                <template #header>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-primary" />
                            <h2 class="text-xl font-semibold">Participants</h2>
                            <UBadge color="secondary" variant="soft">{{
                                project.userProjects.length
                            }}</UBadge>
                        </div>
                        <AddUserToProjectModal v-if="isOwner" :projectId="project.id"
                            @participant-added="onParticipantAdded">
                        </AddUserToProjectModal>
                    </div>
                </template>

                <div v-if="project.userProjects.length > 0" class="divide-y divide-gray-200 dark:divide-gray-800">
                    <div v-for="userProject in project.userProjects" :key="userProject.userId"
                        class="py-4 first:pt-0 last:pb-0">
                        <div class="flex items-center gap-4">
                            <UAvatar :src="userProject.user.image || undefined" :alt="userProject.user.name || 'User'"
                                size="md" />
                            <div class="flex-1">
                                <p class="font-semibold text-gray-900 dark:text-white">{{
                                    userProject.user.name
                                }}</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">{{
                                    userProject.user.email
                                }}</p>
                            </div>
                            <UButton v-if="isOwner && userProject.user.id !== project.ownerId" size="sm" color="error"
                                variant="ghost" class="rounded-full" @click="removeParticipant(userProject.user.id)">
                                <UIcon name="i-heroicons-user-minus" class="w-5 h-5" />
                            </UButton>
                        </div>
                    </div>
                </div>
                <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
                    No team members yet
                </div>
            </UCard>

            <!-- Tasks Card -->
            <UCard>
                <template #header>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <UIcon name="i-heroicons-clipboard-document-list" class="w-5 h-5 text-primary" />
                            <h2 class="text-xl font-semibold">Tasks</h2>
                            <UBadge color="secondary" variant="soft">{{
                                project.tasks.length
                            }}</UBadge>
                        </div>
                        <ProjectTaskCreationModal v-if="isOwner" :projectId="project.id"
                            :participants="project.userProjects" @task-added="onTaskAdded" />
                    </div>
                </template>

                <div v-if="project.tasks.length > 0" class="divide-y divide-gray-200 dark:divide-gray-800">
                    <div v-for="task in project.tasks.filter(task => task.type === 'TASK')" :key="task.id"
                        class="py-4 first:pt-0 last:pb-0">
                        <NuxtLink :to="`/tasks/${task.id}`"
                            class="block hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-md">
                            <div class="flex items-start gap-3">
                                <UBadge :color="getTaskTypeColor(task.type)" variant="soft">
                                    {{ getTaskTypeLabel(task.type) }}
                                </UBadge>
                                <div class="flex-1">
                                    <p class="font-semibold text-gray-900 dark:text-white">
                                        {{ task.name || 'UntitledTask' }}
                                    </p>
                                    <p v-if="task.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {{ task.description }}
                                    </p>
                                </div>
                            </div>
                        </NuxtLink>
                    </div>
                </div>
                <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
                    No tasks yet
                </div>
            </UCard>
        </div>
    </div>
</template>
