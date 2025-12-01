<script setup lang="ts">
useHead({ title: 'Sign In' })
definePageMeta({ layout: false })
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const { signIn, status } = useAuth()

// Watch for auth status changes and redirect when authenticated
watch(
  status,
  (newStatus) => {
    if (newStatus === 'authenticated') {
      navigateTo('/')
    }
  },
  { immediate: true },
)

async function handleCredentialsLogin() {
  loading.value = true
  error.value = ''

  const result = await signIn('credentials', {
    email: email.value,
    password: password.value,
    redirect: false,
  })
  console.log(result)

  if (result?.error) {
    error.value = 'Invalid email or password'
  }

  loading.value = false
}
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

      <div class="space-y-6 pb-6">
        <div class="text-center space-y-2">
          <Logo class="size-20 mx-auto mb-4" />
          <p class="text-gray-600 dark:text-gray-400">
            Sign in to access your projects and calendar.
          </p>
        </div>

        <form
          @submit.prevent="handleCredentialsLogin"
          class="flex flex-col gap-2"
        >
          <UFormGroup label="Email" name="email" required class="w-full">
            <UInput
              v-model="email"
              type="email"
              placeholder="you@company.com"
              icon="i-heroicons-envelope"
              size="lg"
              required
              class="w-full"
            />
          </UFormGroup>

          <UFormGroup label="Password" name="password" required>
            <UInput
              v-model="password"
              type="password"
              placeholder="Enter your password"
              icon="i-heroicons-lock-closed"
              size="lg"
              required
              class="w-full"
            />
          </UFormGroup>

          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-triangle"
            :title="error"
            class="mt-4"
          />

          <UButton
            type="submit"
            :loading="loading"
            block
            size="lg"
            color="primary"
            class="mt-6"
          >
            Sign In
          </UButton>
        </form>

        <USeparator label="OR" />

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
