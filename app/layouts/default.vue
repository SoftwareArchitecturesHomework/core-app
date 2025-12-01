<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const { status, signOut, signIn } = useAuth()
const { user, canManage } = useUser()

const links = computed<NavigationMenuItem[]>(() => {
  const items: NavigationMenuItem[] = [
    { label: 'Projects', to: '/projects', icon: 'i-heroicons-folder' },
    { label: 'Calendar', to: '/calendar', icon: 'i-heroicons-calendar' },
  ]

  if (canManage.value) {
    items.push(
      {
        label: 'Approvals',
        to: '/approvals',
        icon: 'i-heroicons-check-circle',
      },
      {
        label: 'Reports',
        to: '/reports',
        icon: 'i-heroicons-chart-bar',
      },
      {
        label: 'Administration',
        to: '/administration',
        icon: 'i-heroicons-clipboard-document-check',
      },
    )
  }

  return items
})

const userMenuItems = [
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
        <Logo small class="size-8" />
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
