<script setup lang="ts">
const props = defineProps<{
    administration: {
        id: number
        name: string
        email: string
        image: string | null
        administeredHours: number
        requiredHours: number
        vacationDays: number
        difference: number
        status: 'sufficient' | 'insufficient' | 'none'
    }
}>()

const statusConfig = computed(() => {
    switch (props.administration.status) {
        case 'sufficient':
            return {
                color: 'text-green-600 dark:text-green-400',
                bgColor: 'bg-green-50 dark:bg-green-900/20',
                icon: 'i-heroicons-check-circle',
                label: 'Complete'
            }
        case 'insufficient':
            return {
                color: 'text-orange-600 dark:text-orange-400',
                bgColor: 'bg-orange-50 dark:bg-orange-900/20',
                icon: 'i-heroicons-exclamation-circle',
                label: 'Incomplete'
            }
        case 'none':
            return {
                color: 'text-red-600 dark:text-red-400',
                bgColor: 'bg-red-50 dark:bg-red-900/20',
                icon: 'i-heroicons-x-circle',
                label: 'No Hours'
            }
    }
})
</script>

<template>
    <div
        class="rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
        <div class="p-4 grid grid-cols-12 gap-4 items-center">
            <!-- User Info (3 cols) -->
            <div class="col-span-12 sm:col-span-3 flex items-center gap-3">
                <UAvatar :src="administration.image || undefined" :alt="administration.name || 'User'" size="sm" />
                <div class="min-w-0">
                    <p class="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {{ administration.name }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {{ administration.email }}
                    </p>
                </div>
            </div>

            <!-- Hours Stats (6 cols) -->
            <div class="col-span-12 sm:col-span-6 grid grid-cols-3 gap-3">
                <!-- Administered Hours -->
                <div class="flex flex-col">
                    <span class="text-xs text-gray-500 dark:text-gray-400 mb-1">Administered</span>
                    <div class="flex items-center gap-1">
                        <UIcon name="i-heroicons-clock" class="w-4 h-4 text-gray-400" />
                        <span class="text-sm font-semibold text-gray-900 dark:text-white">
                            {{ administration.administeredHours }}h
                        </span>
                    </div>
                </div>

                <!-- Required Hours -->
                <div class="flex flex-col">
                    <span class="text-xs text-gray-500 dark:text-gray-400 mb-1">Required</span>
                    <div class="flex items-center gap-1">
                        <UIcon name="i-heroicons-calendar" class="w-4 h-4 text-gray-400" />
                        <span class="text-sm font-semibold text-gray-900 dark:text-white">
                            {{ administration.requiredHours }}h
                        </span>
                    </div>
                </div>

                <!-- Difference -->
                <div class="flex flex-col">
                    <span class="text-xs text-gray-500 dark:text-gray-400 mb-1">Difference</span>
                    <div class="flex items-center gap-1">
                        <UIcon
                            :name="administration.difference >= 0 ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'"
                            class="w-4 h-4"
                            :class="administration.difference >= 0 ? 'text-green-500' : 'text-red-500'" />
                        <span class="text-sm font-semibold"
                            :class="administration.difference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                            {{ administration.difference > 0 ? '+' : '' }}{{ administration.difference }}h
                        </span>
                    </div>
                </div>
            </div>

            <!-- Status Badge (3 cols) -->
            <div class="col-span-12 sm:col-span-3 flex items-center justify-end gap-3">
                <!-- Vacation Days (if any) -->
                <div v-if="administration.vacationDays > 0"
                    class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <UIcon name="i-heroicons-sun" class="w-3 h-3" />
                    <span>{{ administration.vacationDays }}d off</span>
                </div>

                <!-- Status Badge -->
                <div class="px-3 py-1 rounded-full flex items-center gap-1.5" :class="statusConfig.bgColor">
                    <UIcon :name="statusConfig.icon" class="w-4 h-4" :class="statusConfig.color" />
                    <span class="text-xs font-medium" :class="statusConfig.color">
                        {{ statusConfig.label }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>