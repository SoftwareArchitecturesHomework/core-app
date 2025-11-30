<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const { status, signOut, signIn } = useAuth()
const { user } = useUser()
const colorMode = useColorMode()

const links = computed<NavigationMenuItem[]>(() => [
  { label: 'Projects', to: '/projects', leadingIcon: 'project' },
  { label: 'Calendar', to: '/calendar', leadingIcon: 'calendar' },
])

const userMenuItems = [
  [
    {
      label: 'Switch Account',
      icon: 'i-heroicons-arrow-path-rounded-square',
      onSelect: () => {
        signOut({ redirect: false })
        signIn('google', {
          callbackUrl: route.fullPath !== '/' ? route.fullPath : '/projects',
        })
      },
    },
  ],
  [
    {
      label: 'Logout',
      icon: 'i-heroicons-arrow-right-on-rectangle',
      onSelect: () => signOut({ callbackUrl: '/login' }),
    },
  ],
]
</script>

<template>
  <UHeader to="/" mode="slideover">
    <template #title class="flex items-center">
      <div class="flex items-center gap-2">
        <img
          :src="
            colorMode.value === 'light'
              ? '/favicon-light.png'
              : '/favicon-dark.png'
          "
          alt="WorkPlanner Logo"
          class="h-11 max-xs:hidden"
        />
        <h1 class="text-xl font-bold max-md:hidden">WorkPlanner</h1>
      </div>
    </template>

    <UNavigationMenu :items="links" />
    <template #body>
      <UNavigationMenu :items="links" orientation="vertical" />
    </template>

    <template #right>
      <div
        v-if="status === 'authenticated'"
        class="flex items-center gap-3 whitespace-nowrap"
      >
        <div class="text-sm whitespace-nowrap">
          {{ user?.name || user?.email || 'User' }}
        </div>

        <UDropdownMenu
          :items="userMenuItems"
          :popper="{ placement: 'bottom-end' }"
        >
          <UAvatar
            v-if="user?.image"
            :src="user.image"
            :alt="user.name || 'User avatar'"
            size="lg"
            class="cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
          />
        </UDropdownMenu>
      </div>
      <UColorModeButton />
    </template>
  </UHeader>

  <slot></slot>
</template>
