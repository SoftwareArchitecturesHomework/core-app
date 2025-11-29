<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { ExtendedUser } from '~~/types/extended-user'

const { data: session, status, signOut, signIn } = useAuth()
const user = session?.value?.user as ExtendedUser | undefined
const route = useRoute()

const links = computed<NavigationMenuItem[]>(() => {
    const items: NavigationMenuItem[] = [
        { label: 'Projects', to: '/projects', icon: 'i-heroicons-folder' },
        { label: 'Calendar', to: '/calendar', icon: 'i-heroicons-calendar' },
    ]

    if (user?.role === 'MANAGER' || user?.role === 'ADMIN') {
        items.push({ label: 'Approvals', to: '/approvals', icon: 'i-heroicons-check-circle' })
        items.push({ label: 'Reports', to: '/reports', icon: 'i-heroicons-chart-bar' })
        items.push({ label: 'Administration', to: '/administration', icon: 'i-heroicons-clipboard-document-check' })
    }

    return items
})

const userMenuItems = [
    [{
        label: 'Switch Account',
        icon: 'i-heroicons-arrow-path-rounded-square',
        onSelect: () => {
            signOut({ redirect: false })
            signIn('google', {
                callbackUrl: route.fullPath !== '/' ? route.fullPath : '/projects',
            })
        }
    }],
    [{
        label: 'Logout',
        icon: 'i-heroicons-arrow-right-on-rectangle',
        onSelect: () => signOut({ callbackUrl: '/login' })
    }]
]

</script>

<template>
    <ClientOnly>
        <UHeader :toggle="false">
            <template #title>
                <NuxtLink to="/" class="text-xl font-bold">
                    WorkPlanner
                </NuxtLink>
            </template>

            <template #default>
                <UNavigationMenu :items="links" class="space-x-6" />
            </template>

            <template #right>
                <ClientOnly>
                    <div v-if="status === 'authenticated'" class="flex items-center gap-3 whitespace-nowrap">
                        <div class="text-sm whitespace-nowrap">
                            {{ session?.user?.name || session?.user?.email || 'User' }}
                        </div>

                        <UDropdownMenu :items="userMenuItems" :popper="{ placement: 'bottom-end' }">
                            <UAvatar v-if="session?.user?.image" :src="session.user.image"
                                :alt="session.user.name || 'User avatar'" size="lg"
                                class="cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all" />
                        </UDropdownMenu>
                    </div>
                </ClientOnly>
            </template>
        </UHeader>
    </ClientOnly>

    <slot></slot>
</template>