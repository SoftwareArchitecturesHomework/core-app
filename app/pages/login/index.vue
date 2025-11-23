<script setup lang="ts">
const { signIn, status } = useAuth()

if (status.value === "authenticated") {
  navigateTo("/")
}
</script>

<template>
  <div class="p-10 flex flex-col gap-4">
    <h1 class="text-2xl font-bold">Login</h1>

    <button class="px-4 py-2 bg-blue-600 text-black rounded" @click="signIn('google')">
      Sign in with Google
    </button>
  </div>
</template>
