<script setup lang="ts">
useHead({
    title: 'Projects',
})
const { userId, canCreateProject } = useUser()
const { data: participatedProjects, refresh: refreshParticipated } =
    await useFetch('/api/projects', {
        query: computed(() =>
            userId.value ? { participantId: userId.value } : undefined,
        ),
    })
</script>

<template>
    <div class="p-6 max-w-7xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
            <div>
                <h1 class="text-4xl font-bold text-gray-900 dark:text-white">Projects</h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Manage and view your projects</p>
            </div>
        </div>

        <ProjectList v-if="canCreateProject" @created="refreshParticipated()" />

        <!-- Projects you participate in -->
        <div class="mb-8">
            <div class="flex items-center gap-2 mb-4">
                <UIcon name="i-heroicons-user-group" class="w-6 h-6 text-primary" />
                <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
                    Projects You Participate In
                </h2>
            </div>

            <div v-if="participatedProjects && participatedProjects.length > 0"
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ProjectCard v-for="project in participatedProjects" :key="project.id" :project="project"
                    :role="'member'" />
            </div>

            <UCard v-else>
                <div class="text-center py-12">
                    <UIcon name="i-heroicons-inbox" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p class="text-gray-600 dark:text-gray-400">
                        You're not participating in any projects yet
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Wait to be added to a project by a manager
                    </p>
                </div>
            </UCard>
        </div>
    </div>
</template>
