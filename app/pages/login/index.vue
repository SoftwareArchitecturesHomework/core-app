<script setup lang="ts">
useHead({ title: 'Sign In' })
definePageMeta({ layout: false })

const { signIn, status } = useAuth()

// Watch for auth status changes and redirect when authenticated
watch(
  status,
  (newStatus) => {
    if (newStatus === 'authenticated') {
      navigateTo('/projects')
    }
  },
  { immediate: true },
)
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-linear-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800"
  >
    <UCard class="w-full max-w-md shadow-xl">
      <template #header>
        <div class="text-center space-y-2">
          <h1 class="text-3xl font-bold text-primary-600 dark:text-primary-400">
            WorkPlanner
          </h1>
        </div>
      </template>

      <div class="space-y-6 py-6">
        <div class="text-center space-y-2">
          <UIcon
            name="i-heroicons-calendar-days"
            class="w-20 h-20 mx-auto text-primary-500"
          />
          <p class="text-gray-600 dark:text-gray-400">
            Sign in to access your projects and calendar.
          </p>
        </div>

        <USeparator label="Continue with" />

        <UButton
          block
          size="lg"
          color="neutral"
          variant="outline"
          icon="i-logos-google-icon"
          class="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
          @click="signIn('google')"
        >
          Sign in with Google
        </UButton>
      </div>

      <template #footer>
        <div class="text-center text-xs text-gray-500 dark:text-gray-400">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </div>
      </template>
    </UCard>
  </div>
</template>
