<script setup lang="ts">
const emit = defineEmits<{ created: [] }>()

const { userId, canManage } = useUser()
const { data: ownedProjects, refresh: refreshOwned } = await useFetch(
  '/api/projects',
  { query: computed(() => ({ ownerId: userId.value })) },
)

async function onProjectCreated() {
  emit('created')
  await refreshOwned()
}
</script>

<template>
  <div v-if="canManage" class="mb-12">
    <div class="flex items-center justify-between gap-4 mb-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-briefcase" class="w-6 h-6 text-primary" />
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Projects You Own
        </h2>
      </div>
      <ProjectCreationModal @project-created="onProjectCreated" />
    </div>

    <div
      v-if="ownedProjects && ownedProjects.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <ProjectCard
        v-for="project in ownedProjects"
        :key="project.id"
        :project="project"
        :role="'owner'"
      />
    </div>

    <UCard v-else>
      <div class="text-center py-12">
        <UIcon
          name="i-heroicons-folder-open"
          class="w-16 h-16 mx-auto text-gray-400 mb-4"
        />
        <p class="text-gray-600 dark:text-gray-400">No owned projects yet</p>
        <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">
          Create your first project to get started
        </p>
      </div>
    </UCard>
  </div>
</template>
