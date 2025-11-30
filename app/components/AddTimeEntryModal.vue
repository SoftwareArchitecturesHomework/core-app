<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import { getLocalTimeZone, today } from '@internationalized/date'
import { reactive, shallowRef } from 'vue'

const isOpen = defineModel<boolean>({ default: false })

const props = defineProps<{
  taskId: number
}>()

const emit = defineEmits<{
  'time-entry-added': []
}>()

const newTimeEntry = reactive({
  hours: '',
  note: '',
})

const entryDate = shallowRef<DateValue>(today(getLocalTimeZone()))
const isSubmitting = ref(false)
const toast = useToast()

function resetForm() {
  newTimeEntry.hours = ''
  newTimeEntry.note = ''
  entryDate.value = today(getLocalTimeZone())
}

function onCancel() {
  resetForm()
  isOpen.value = false
}

async function onSubmit() {
  if (!entryDate.value || !newTimeEntry.hours) {
    toast.add({
      title: 'Validation Error',
      description: 'Date and hours are required',
      color: 'error',
    })
    return
  }

  const hours = parseFloat(newTimeEntry.hours)
  if (isNaN(hours) || hours <= 0) {
    toast.add({
      title: 'Validation Error',
      description: 'Hours must be a positive number',
      color: 'error',
    })
    return
  }

  isSubmitting.value = true

  try {
    await $fetch('/api/time-entries', {
      method: 'POST',
      body: {
        taskId: props.taskId,
        date: new Date(entryDate.value.toString()),
        hours: hours,
        note: newTimeEntry.note || null,
      },
    })

    toast.add({
      title: 'Success',
      description: 'Time entry added successfully',
      color: 'primary',
    })

    resetForm()
    isOpen.value = false
    emit('time-entry-added')
  } catch (error: any) {
    console.error('Time entry creation error:', error)
    const errorMessage =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      'Failed to add time entry'
    toast.add({
      title: 'Error',
      description: errorMessage,
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal v-model:open="isOpen" title="Add Time Entry" size="md">
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="space-y-2">
          <label class="block text-sm font-medium">Date *</label>
          <UPopover>
            <UButton variant="outline" class="w-full justify-start">
              <UIcon name="i-heroicons-calendar" class="w-4 h-4 mr-2" />
              {{ entryDate ? entryDate.toString() : 'Select date' }}
            </UButton>

            <template #content>
              <UCalendar v-model="entryDate" class="w-auto" />
            </template>
          </UPopover>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium">Hours *</label>
          <UInput
            v-model="newTimeEntry.hours"
            type="number"
            step="0.5"
            min="0"
            placeholder="e.g. 2.5"
            class="w-full"
          >
            <template #trailing>
              <span class="text-gray-400 text-sm">hours</span>
            </template>
          </UInput>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium">Note (optional)</label>
          <UTextarea
            v-model="newTimeEntry.note"
            placeholder="Add any notes about this work session..."
            :rows="3"
            class="w-full"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end space-x-2">
        <UButton variant="soft" @click="onCancel" :disabled="isSubmitting"
          >Cancel</UButton
        >
        <UButton
          color="primary"
          @click="onSubmit"
          :loading="isSubmitting"
          :disabled="isSubmitting"
        >
          Add Time Entry
        </UButton>
      </div>
    </template>
  </UModal>
</template>
