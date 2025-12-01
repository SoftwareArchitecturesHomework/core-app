<script setup lang="ts">
const props = defineProps<{
  vacationRequest: any
}>()

const emit = defineEmits<{
  requestUpdated: []
}>()

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const route = useRoute()
const toast = useToast()

watch(
  () => route.query.action,
  (command) => {
    if (!command) return
    const [action, id] = command.toString().split(':')
    if (
      ['approve', 'reject'].includes(action as any) &&
      id === props.vacationRequest.id.toString()
    ) {
      console.log(action)

      decide(action as 'approve' | 'reject').then(() => {
        toast.add({
          title: 'Action processed',
          description:
            action === 'approve'
              ? 'The vacation request has been approved.'
              : 'The vacation request has been rejected.',
          color: action === 'approve' ? 'success' : 'error',
        })

        navigateTo({
          path: route.path,
          query: {
            ...route.query,
            action: undefined,
          },
        })
      })
    }
  },
  { deep: true, immediate: true },
)

function decide(action: 'approve' | 'reject') {
  return $fetch(`/api/tasks/${props.vacationRequest.id}/${action}`, {
    method: 'POST',
  }).then(() => {
    emit('requestUpdated')
  })
}
</script>

<template>
  <div class="rounded-lg border border-gray-200 dark:border-gray-700">
    <div class="p-4 grid grid-cols-12 gap-4 items-center">
      <!-- User Info (3 cols) -->
      <div class="col-span-12 sm:col-span-3 flex items-center gap-3">
        <UAvatar
          :src="vacationRequest.creator.image || undefined"
          :alt="vacationRequest.creator.name || 'User'"
          size="sm"
        />
        <div class="min-w-0">
          <p class="font-medium text-sm text-gray-900 dark:text-white truncate">
            {{ vacationRequest.creator.name }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
            {{ vacationRequest.creator.email }}
          </p>
        </div>
      </div>

      <!-- Date Range (3 cols) -->
      <div class="col-span-6 sm:col-span-3 flex items-center gap-2">
        <UIcon
          name="i-heroicons-calendar-days"
          class="w-4 h-4 text-gray-400 flex-shrink-0"
        />
        <span class="text-sm text-gray-700 dark:text-gray-300">
          {{ formatDate(vacationRequest.startDate) }} -
          {{ formatDate(vacationRequest.endDate) }}
        </span>
      </div>

      <!-- Description (4 cols) -->
      <div class="col-span-6 sm:col-span-4">
        <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
          {{ vacationRequest.description || 'No reason provided' }}
        </p>
      </div>

      <!-- Actions (2 cols) -->
      <div class="col-span-12 sm:col-span-2 flex justify-end gap-2">
        <UButton
          color="error"
          variant="ghost"
          size="xs"
          square
          @click="decide('reject')"
        >
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          Reject
        </UButton>
        <UButton
          color="success"
          variant="ghost"
          size="xs"
          square
          @click="decide('approve')"
        >
          <UIcon name="i-heroicons-check" class="w-4 h-4" />
          Approve
        </UButton>
      </div>
    </div>
  </div>
</template>
