<script setup lang="ts">
const { status, signOut } = useAuth()
const { user } = useUser()
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-8">
    <div class="w-full max-w-md border rounded-lg p-6">
      <div v-if="status === 'loading'">Loading session...</div>

      <div v-else-if="status === 'unauthenticated'">
        Not signed in. Go to /login.
      </div>

      <div v-else>
        <div class="flex items-center gap-4 mb-6">
          <img
            v-if="user?.image"
            :src="user.image"
            alt="avatar"
            class="w-14 h-14 rounded-full border"
          />
          <div>
            <div>{{ user?.name || 'No name' }}</div>
            <div class="text-sm opacity-70">{{
              user?.email || 'No email'
            }}</div>
          </div>
        </div>

        <div class="space-y-2 text-sm">
          <div>id: {{ user?.id }}</div>
          <div>role: {{ user?.role }}</div>
        </div>

        <button
          class="mt-6 w-full border rounded px-4 py-2"
          @click="signOut({ callbackUrl: '/login' })"
        >
          Logout
        </button>
      </div>
    </div>
  </div>
</template>
