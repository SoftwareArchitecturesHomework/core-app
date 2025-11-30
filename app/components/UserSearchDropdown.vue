<script setup lang="ts">
import type { AvatarProps } from '@nuxt/ui'
import type {
  SerializedUser,
  UserDropdownOption,
} from '~~/types/user-dropdown-option'

const selectedUser = defineModel<UserDropdownOption>()

const props = defineProps<{
  userOptions: SerializedUser[]
}>()

const users = computed(() => {
  return (
    props.userOptions?.map((user) => ({
      label: user.name || 'Unknown User',
      email: user.email || '',
      value: user.id,
      avatar: user.image ? { src: user.image } : undefined,
    })) || []
  )
})
</script>

<template>
  <USelectMenu
    v-model="selectedUser"
    :items="users"
    :filter-fields="['label', 'email']"
    icon="i-heroicons-user"
    placeholder="Search for a team member..."
    searchable
    class="w-full"
  >
    <template #leading="{ modelValue, ui }">
      <UAvatar
        v-if="modelValue"
        v-bind="modelValue.avatar"
        :size="(ui.leadingAvatarSize() as AvatarProps['size'])"
        :class="ui.leadingAvatar()"
      />
    </template>

    <template #item-label="{ item }">
      {{ item.label }}

      <span class="text-muted">
        {{ item.email }}
      </span>
    </template>
  </USelectMenu>
</template>
