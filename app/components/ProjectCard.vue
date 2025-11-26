<script setup lang="ts">
interface Project {
    id: number
    name: string
    startDate: string
    endDate: string | null
}

interface Props {
    project: Project
    role: 'owner' | 'member'
}

const props = defineProps<Props>()

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

function navigateToProject() {
    navigateTo(`/projects/${props.project.id}`)
}
</script>

<template>
    <UCard class="hover:shadow-xl hover:scale-105 hover:border-primary transition-all duration-300 cursor-pointer group"
        @click="navigateToProject">
        <template #header>
            <div class="flex items-start justify-between">
                <h3
                    class="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                    {{ project.name }}
                </h3>
                <UBadge :color="role === 'owner' ? 'primary' : 'gray'" variant="soft">
                    {{ role === 'owner' ? 'Owner' : 'Member' }}
                </UBadge>
            </div>
        </template>

        <div class="space-y-2">
            <div
                class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
                <span>Start: {{ formatDate(project.startDate) }}</span>
            </div>
            <div v-if="project.endDate"
                class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                <UIcon name="i-heroicons-calendar-days" class="w-4 h-4" />
                <span>End: {{ formatDate(project.endDate) }}</span>
            </div>
            <div v-else
                class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                <span class="italic">Ongoing</span>
            </div>
        </div>

        <template #footer>
            <div
                class="flex items-center gap-2 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View details</span>
                <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
            </div>
        </template>
    </UCard>
</template>
