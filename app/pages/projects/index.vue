<script setup lang="ts">
import type { ExtendedUser } from '~~/types/extended-user'
import ProjectCreationModal from '~~/app/components/ProjectCreationModal.vue'
import ProjectCard from '~~/app/components/ProjectCard.vue'

const { data: session } = useAuth()

const user = computed(() => session.value?.user as ExtendedUser | undefined)

// Fetch projects the user participates in
const { data: participatedProjects, refresh: refreshParticipated } = await useFetch('/api/projects', {
    query: computed(() => {
        if (!user.value?.id) return {}
        return { participantId: user.value.id }
    }),
})

// Fetch projects the user owns (only for managers/admins)
const { data: ownedProjects, refresh: refreshOwned } = await useFetch('/api/projects', {
    query: computed(() => {
        if (!user.value?.id || (user.value.role !== 'MANAGER' && user.value.role !== 'ADMIN')) {
            return { skip: true }
        }
        return { ownerId: user.value.id }
    }),
})

async function onProjectCreated() {
    await Promise.all([refreshParticipated(), refreshOwned()])
}
</script>

<template>
    <div class="p-6 max-w-7xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
            <div>
                <h1 class="text-4xl font-bold text-gray-900 dark:text-white">Projects</h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Manage and view your projects</p>
            </div>
            <ProjectCreationModal v-if="user?.role === 'MANAGER' || user?.role === 'ADMIN'"
                @project-created="onProjectCreated" />
        </div>

        <!-- Projects you own (for managers/admins) -->
        <div v-if="user?.role === 'MANAGER' || user?.role === 'ADMIN'" class="mb-12">
            <div class="flex items-center gap-2 mb-4">
                <UIcon name="i-heroicons-briefcase" class="w-6 h-6 text-primary" />
                <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Projects You Own</h2>
            </div>

            <div v-if="ownedProjects && ownedProjects.length > 0"
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ProjectCard v-for="project in ownedProjects" :key="project.id" :project="project" :role="'owner'" />
            </div>

            <UCard v-else>
                <div class="text-center py-12">
                    <UIcon name="i-heroicons-folder-open" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p class="text-gray-600 dark:text-gray-400">No owned projects yet</p>
                    <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">Create your first project to get started
                    </p>
                </div>
            </UCard>
        </div>

        <!-- Projects you participate in -->
        <div class="mb-8">
            <div class="flex items-center gap-2 mb-4">
                <UIcon name="i-heroicons-user-group" class="w-6 h-6 text-primary" />
                <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Projects You Participate In</h2>
            </div>

            <div v-if="participatedProjects && participatedProjects.length > 0"
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ProjectCard v-for="project in participatedProjects" :key="project.id" :project="project"
                    :role="'member'" />
            </div>

            <UCard v-else>
                <div class="text-center py-12">
                    <UIcon name="i-heroicons-inbox" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p class="text-gray-600 dark:text-gray-400">You're not participating in any projects yet</p>
                    <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">Wait to be added to a project by a manager
                    </p>
                </div>
            </UCard>
        </div>
    </div>
</template>
