<script lang="ts" setup>
const colorMode = toRef(useColorMode(), 'value')
defineProps<{
  small?: boolean
}>()
</script>

<template>
  <img v-if="small" v-bind="$attrs" :src="`/logo.png`" alt="WorkPlanner Logo" />
  <ClientOnly v-else>
    <img
      v-bind="$attrs"
      :src="`/logo-${colorMode}.png`"
      alt="WorkPlanner Logo"
    />
    <template #fallback>
      <div
        v-bind="$attrs"
        class="bg-transparent border-2 border-primary rounded-full animate-pulse"
      ></div>
    </template>
  </ClientOnly>
</template>
