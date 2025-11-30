<script setup lang="ts">
useHead({
  titleTemplate: (title) => (title ? `${title} - WorkPlanner` : 'WorkPlanner'),
  link: [
    {
      rel: 'icon',
      type: 'image/png',
      href: '/favicon-light.png',
      media: '(prefers-color-scheme: light)',
    },
    {
      rel: 'icon',
      type: 'image/png',
      href: '/favicon-dark.png',
      media: '(prefers-color-scheme: dark)',
    },
  ],
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
