<script setup lang="ts">
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth())
const availableMonths = computed(() => {
    if (selectedYear.value === new Date().getFullYear()) {
        return Array.from({ length: new Date().getMonth() }, (_, i) => i + 1)
    }
    return Array.from({ length: 12 }, (_, i) => i + 1)
})
const availableYears = computed(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 20 }, (_, i) => currentYear - i)
})
const { data: userAdministrations } = await useFetch('/api/users/time-administration', {
    query: computed(() => ({
        year: selectedYear.value,
        month: selectedMonth.value,
    })),
})


</script>

<template>
    <div class="p-6 max-w-7xl mx-auto">
        <div class="mb-8">
            <div class="flex items-center gap-2 mb-4">
                <UIcon name="i-heroicons-cog-8-tooth" class="w-6 h-6 text-primary" />
                <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
                    User Time Administrations
                </h2>
            </div>
        </div>
        <div class="flex items-center gap-2 mb-4 p-3">
            <label for="year-select" class="font-medium text-gray-700 dark:text-gray-300">Year:</label>
            <USelect id="year-select" v-model="selectedYear" :items="availableYears"
                class="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            </USelect>

            <label for="month-select" class="font-medium text-gray-700 dark:text-gray-300">Month:</label>
            <USelect id="month-select" v-model="selectedMonth" :items="availableMonths"
                class="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            </USelect>
        </div>
        <div v-if="userAdministrations && userAdministrations.length > 0" class="space-y-4">
            <TimeAdministrationCard v-for="administration in userAdministrations" :key="administration.id"
                :administration="administration" />
        </div>
    </div>
</template>
