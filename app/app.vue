<script setup lang="ts">
useHead({
  titleTemplate: (title) => (title ? `${title} - WorkPlanner` : 'WorkPlanner'),
})
</script>

<template>
  <div class="min-h-screen">
    <UApp>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UApp>
  </div>
</template>
