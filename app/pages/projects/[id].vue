<script setup lang="ts">
import type { ExtendedUser } from '~~/types/extended-user'

const route = useRoute()
const projectId = route.params.id
const { data: session } = useAuth()

const user = computed(() => session.value?.user as ExtendedUser | undefined)

const { data: project, error, pending } = await useFetch(`/api/projects/${projectId}`)

const isOwner = computed(() => project.value?.ownerId === user.value?.id)

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

function getStatusColor(endDate: string | null) {
    if (!endDate) return 'green'
    const end = new Date(endDate)
    const now = new Date()
    return end > now ? 'blue' : 'gray'
}

function getStatusLabel(endDate: string | null) {
    if (!endDate) return 'Ongoing'
    const end = new Date(endDate)
    const now = new Date()
    return end > now ? 'Active' : 'Completed'
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
                <p class="text-gray-600 dark:text-gray-400">{{ error.statusMessage || 'Failed to load project details'
                    }}</p>
                <UButton class="mt-4" @click="navigateTo('/projects')">
                    Back to Projects
                </UButton>
            </div>
        </UCard>

        <!-- Project Details -->
        <div v-else-if="project" class="space-y-6">
            <!-- Header -->
            <div class="flex items-start justify-between">
                <div>
                    <div class="flex items-center gap-3 mb-2">
                        <UButton variant="ghost" color="gray" icon="i-heroicons-arrow-left"
                            @click="navigateTo('/projects')">
                            Back
                        </UButton>
                        <h1 class="text-4xl font-bold text-gray-900 dark:text-white">{{ project.name }}</h1>
                    </div>
                    <div class="flex items-center gap-3 mt-2">
                        <UBadge :color="getStatusColor(project.endDate)" variant="soft" size="lg">
                            {{ getStatusLabel(project.endDate) }}
                        </UBadge>
                        <UBadge v-if="isOwner" color="primary" variant="soft" size="lg">
                            Owner
                        </UBadge>
                    </div>
                </div>
            </div>

            <!-- Project Info Card -->
            <UCard>
                <template #header>
                    <div class="flex items-center gap-2">
                        <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-primary" />
                        <h2 class="text-xl font-semibold">Project Information</h2>
                    </div>
                </template>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Start Date</label>
                        <div class="flex items-center gap-2 mt-1">
                            <UIcon name="i-heroicons-calendar" class="w-5 h-5 text-gray-500" />
                            <span class="text-gray-900 dark:text-white">{{ formatDate(project.startDate) }}</span>
                        </div>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-600 dark:text-gray-400">End Date</label>
                        <div class="flex items-center gap-2 mt-1">
                            <UIcon name="i-heroicons-calendar-days" class="w-5 h-5 text-gray-500" />
                            <span class="text-gray-900 dark:text-white">
                                {{ project.endDate ? formatDate(project.endDate) : 'Not set' }}
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
                        <p class="font-semibold text-gray-900 dark:text-white">{{ project.owner.name }}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">{{ project.owner.email }}</p>
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
                            <UBadge color="gray" variant="soft">{{ project.userProjects.length }}</UBadge>
                        </div>
                    </div>
                </template>

                <div v-if="project.userProjects.length > 0" class="divide-y divide-gray-200 dark:divide-gray-800">
                    <div v-for="userProject in project.userProjects" :key="userProject.userId"
                        class="py-4 first:pt-0 last:pb-0">
                        <div class="flex items-center gap-4">
                            <UAvatar :src="userProject.user.image || undefined" :alt="userProject.user.name || 'User'"
                                size="md" />
                            <div class="flex-1">
                                <p class="font-semibold text-gray-900 dark:text-white">{{ userProject.user.name }}</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">{{ userProject.user.email }}</p>
                            </div>
                            <UBadge
                                :color="userProject.user.role === 'ADMIN' ? 'red' : userProject.user.role === 'MANAGER' ? 'blue' : 'gray'"
                                variant="soft" size="sm">
                                {{ userProject.user.role }}
                            </UBadge>
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
                            <UBadge color="gray" variant="soft">{{ project.tasks.length }}</UBadge>
                        </div>
                    </div>
                </template>

                <div v-if="project.tasks.length > 0" class="divide-y divide-gray-200 dark:divide-gray-800">
                    <div v-for="task in project.tasks" :key="task.id" class="py-4 first:pt-0 last:pb-0">
                        <div class="flex items-start gap-3">
                            <UBadge :color="task.type === 'BUG' ? 'red' : task.type === 'FEATURE' ? 'green' : 'blue'"
                                variant="soft">
                                {{ task.type }}
                            </UBadge>
                            <div class="flex-1">
                                <p class="font-semibold text-gray-900 dark:text-white">{{ task.name || 'Untitled Task'
                                    }}</p>
                                <p v-if="task.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {{ task.description }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
                    No tasks yet
                </div>
            </UCard>
        </div>
    </div>
</template>