<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import { getLocalTimeZone, today } from '@internationalized/date'
import { reactive, shallowRef } from 'vue'
import type { ProjectCreationDto } from '~~/types/project-creation-dto'

const emit = defineEmits<{ 'project-created': [] }>()
const newProject = reactive({
  projectName: '',
})

const isOpen = ref(false)

const startDate = shallowRef<DateValue>(today(getLocalTimeZone()))
const endDate = shallowRef<DateValue | null>(null)

const isSubmitting = ref(false)
const toast = useToast()

function resetForm() {
  newProject.projectName = ''
  startDate.value = today(getLocalTimeZone())
  endDate.value = null
}

function onCancel() {
  resetForm()
  isOpen.value = false
}

async function onSubmit() {
  if (!newProject.projectName || !startDate.value) {
    toast.add({
      title: 'Validation Error',
      description: 'Project name and start date are required',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle',
    })
    return
  }

  // Validate that planned end date is after start date
  if (endDate.value) {
    const startDateObj = new Date(startDate.value.toString())
    const endDateObj = new Date(endDate.value.toString())

    if (endDateObj <= startDateObj) {
      toast.add({
        title: 'Validation Error',
        description: 'Planned end date must be after start date',
        color: 'error',
        icon: 'i-heroicons-exclamation-circle',
      })
      return
    }
  }

  isSubmitting.value = true

  try {
    const dto: ProjectCreationDto = {
      projectName: newProject.projectName,
      startDate: new Date(startDate.value.toString()),
      plannedEndDate: endDate.value ? new Date(endDate.value.toString()) : null,
    }

    const project = await $fetch('/api/projects', {
      method: 'POST',
      body: dto,
    })

    toast.add({
      title: 'Success',
      description: 'Project created successfully',
      color: 'primary',
      icon: 'i-heroicons-check-circle',
    })

    resetForm()
    isOpen.value = false
    emit('project-created')
  } catch (error: any) {
    console.error('Project creation error:', error)
    const errorMessage =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      'Failed to create project'
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
  <UModal v-model:open="isOpen">
    <UButton color="primary" variant="solid"> Create New Project </UButton>
    <template #title>
      <h2 class="text-lg font-semibold">New Project</h2>
    </template>

    <template #body>
      <div class="flex flex-col gap-4">
        <div class="space-y-2">
          <label class="block text-sm font-medium">Project Name *</label>
          <UInput
            v-model="newProject.projectName"
            placeholder="Enter project name"
            class="w-full"
          />
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium">Start date *</label>
          <UPopover>
            <UButton variant="outline" class="w-full justify-start">
              {{ startDate ? startDate.toString() : 'Select date' }}
            </UButton>

            <template #content>
              <UCalendar v-model="startDate" class="w-auto" />
            </template>
          </UPopover>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium">End date</label>
          <UPopover>
            <UButton variant="outline" class="w-full justify-start">
              {{ endDate ? endDate.toString() : 'Not defined' }}
            </UButton>

            <template #content>
              <UCalendar v-model="endDate" class="w-auto" />
            </template>
          </UPopover>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <UButton type="button" variant="ghost" @click="onCancel"
            >Cancel</UButton
          >
          <UButton
            type="button"
            color="primary"
            @click="onSubmit"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            >Create
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
