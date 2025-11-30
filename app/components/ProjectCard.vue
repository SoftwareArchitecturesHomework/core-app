<script setup lang="ts">
interface Project {
    id: number
    name: string
    startDate: string
    endDate: string | null
    plannedEndDate: string | null
}

interface Props {
    project: Project
    role: 'owner' | 'member'
}

const props = defineProps<Props>()

const isOngoing = computed(() => {
    const now = new Date()
    const start = new Date(props.project.startDate)
    const end = props.project.endDate ? new Date(props.project.endDate) : null
    return start <= now && (!end || now <= end)
})

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}
</script>

<template>
    <NuxtLink :to="`/projects/${props.project.id}`">
        <UCard
            class="hover:shadow-xl hover:scale-105 hover:border-primary transition-all duration-300 cursor-pointer group">
            <template #header>
                <div class="flex items-start justify-between">
                    <h3
                        class="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                        {{ project.name }}
                    </h3>
                    <UBadge :color="isOngoing ? 'primary' : 'info'" variant="soft">
                        {{ isOngoing ? 'Ongoing' : 'Completed' }}
                    </UBadge>
                </div>
            </template>

            <div class="space-y-2">
                <div
                    class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                    <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
                    <span>Start: {{ formatDate(project.startDate) }}</span>
                </div>
                <div
                    class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                    <UIcon name="i-heroicons-calendar-days" class="w-4 h-4" />
                    <span>Planned End:
                        {{ project.plannedEndDate ? formatDate(project.plannedEndDate) : "No planned end date" }}</span>
                </div>
            </div>

            <!-- <template #footer>
                <div
                    class="flex items-center gap-2 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View details</span>
                    <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
                </div>
            </template> -->
        </UCard>
    </NuxtLink>
</template>
