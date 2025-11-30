<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const { status, signOut, signIn } = useAuth()
const { user } = useUser()

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
  <ClientOnly>
    <UHeader :toggle="false">
      <template #title>
        <NuxtLink to="/" class="text-xl font-bold"> WorkPlanner </NuxtLink>
      </template>

      <template #default>
        <UNavigationMenu :items="links" class="w-60 space-x-6" />
      </template>

      <template #right>
        <ClientOnly>
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
        </ClientOnly>
      </template>
    </UHeader>
  </ClientOnly>

  <slot></slot>
</template>
