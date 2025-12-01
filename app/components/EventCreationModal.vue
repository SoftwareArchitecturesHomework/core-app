<script setup lang="ts">
import {
  CalendarDate,
  getLocalTimeZone,
  now,
  parseAbsoluteToLocal,
  Time,
  today,
} from '@internationalized/date'
import { ref } from 'vue'
import type { EventCreationDto } from '~~/types/event-creation-dto'

const { userId } = useUser()

const props = defineProps({
  isModalOpen: {
    type: Boolean,
    default: false,
  },
  eventType: {
    type: String,
    default: 'Event',
  },
  selectedEvent: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits<{
  (e: 'update:isModalOpen', value: boolean): void
  (e: 'created'): void
  (e: 'cancel'): void
}>()

let operation = ref('Create New')
const toast = useToast()
const title = ref('')
const description = ref('')
const TIMEZONE = getLocalTimeZone()
const startDate = ref(today(TIMEZONE))
const startTime = ref(now(TIMEZONE))
const endDate = ref(today(TIMEZONE))
const endTime = ref(now(TIMEZONE))
const isAllDay = ref(false)
const taskId = ref<number | null>(null)
const currentStep = ref(0)
const allUsers = ref([])
const invitees = ref([])

const { data: participateProjects } = await useFetch('/api/projects', {
  query: computed(() =>
    userId.value ? { participantId: userId.value } : undefined,
  ),
  transform: (data) => {
    return data?.map((project) => ({
      label: project.name,
      value: String(project.id),
    }))
  },
})

const selectedProject = ref({})

const stepperItems = ref([
  {
    title: 'Details',
    description: 'Enter event details',
    icon: 'i-lucide-file-text',
    slot: 'details' as const,
  },
  {
    title: 'People',
    description: 'Invite team members',
    icon: 'i-lucide-users',
    slot: 'people' as const,
  },
  {
    title: 'Summary',
    description: 'Review and confirm',
    icon: 'i-lucide-check-circle',
    slot: 'summary' as const,
  },
])

function nextStep() {
  if (currentStep.value < stepperItems.value.length - 1) {
    currentStep.value++
  } else {
    save()
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function cancel() {
  emit('update:isModalOpen', false)
  emit('cancel')
  title.value = ''
  description.value = ''
  startDate.value = today(TIMEZONE)
  startTime.value = now(TIMEZONE)
  endDate.value = today(TIMEZONE)
  endTime.value = now(TIMEZONE)
  isAllDay.value = false
  currentStep.value = 0
  allUsers.value = []
  invitees.value = []
  selectedProject.value = {}
  operation.value = 'Create New'
  taskId.value = null
}

async function save() {
  try {
    if (props.eventType === 'Vacation') {
      startTime.value = new Time(0, 0)
      endTime.value = new Time(23, 59)
    }

    const startDateString = startDate.value.toString()
    const formattedStartTime = `${String(startTime.value.hour).padStart(
      2,
      '0',
    )}:${String(startTime.value.minute).padStart(2, '0')}`
    const isoStartString = `${startDateString}T${formattedStartTime}:00.000+01:00`

    const endDateString = endDate.value.toString()
    const formattedEndTime = `${String(endTime.value.hour).padStart(
      2,
      '0',
    )}:${String(endTime.value.minute).padStart(2, '0')}`
    const isoEndString = `${endDateString}T${formattedEndTime}:00.000+01:00`

    const dtoProjectId =
      selectedProject.value &&
      selectedProject.value.value &&
      selectedProject.value.value !== ''
        ? Number(selectedProject.value.value)
        : null

    const participantId = invitees.value
      .map((item) => item.value)
      .filter((value) => value !== '')
      .map((value) => Number(value))

    const dto: EventCreationDto = {
      type: props.eventType,
      name: title.value,
      description: description.value,
      startDate: isoStartString,
      endDate: isoEndString,
      projectId: dtoProjectId,
      taskId: taskId.value,
      participantIds: participantId,
    }

    const event = await $fetch('/api/events', {
      method: 'POST',
      body: dto,
    })

    toast.add({
      title: 'Success',
      description: 'Event created successfully',
      color: 'primary',
      icon: 'i-heroicons-check-circle',
    })

    emit('update:isModalOpen', false)
    emit('created')

    title.value = ''
    description.value = ''
    startDate.value = today(TIMEZONE)
    startTime.value = now(TIMEZONE)
    endDate.value = today(TIMEZONE)
    endTime.value = now(TIMEZONE)
    isAllDay.value = false
    currentStep.value = 0
    allUsers.value = []
    invitees.value = []
    selectedProject.value = {}
    operation.value = 'Create New'
    taskId.value = null
  } catch (error) {
    console.error('Error saving event:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to create event. Please try again.',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle',
    })
  }
}

function isAllDayChanged() {
  if (isAllDay.value) {
    startTime.value = new Time(0, 0)
    endTime.value = new Time(23, 59)
  } else {
    startTime.value = now()
    endTime.value = now()
  }
}

async function fetchParticipants(newProjectId: string) {
  const { data: participants } = await useFetch(
    `/api/projects/${newProjectId}/participants`,
    {
      transform: (data) => {
        if (!data || !Array.isArray(data)) {
          return []
        }
        return data.map((user) => ({
          label: user.user.name,
          value: String(user.user.id),
        }))
      },
    },
  )
  allUsers.value = participants.value
}

watch(
  () => props.selectedEvent,
  (newEvent) => {
    if (newEvent && newEvent.startDate && newEvent.endDate) {
      const rawStartDateString = newEvent.startDate as string
      const rawEndDateString = newEvent.endDate as string
      const startZoned = parseAbsoluteToLocal(rawStartDateString, TIMEZONE)
      const endZoned = parseAbsoluteToLocal(rawEndDateString, TIMEZONE)

      title.value = newEvent.name || ''
      description.value = newEvent.description || ''
      isAllDay.value = newEvent.allDay || false
      props.eventType = newEvent.type
      operation.value = 'Update'
      startDate.value = new CalendarDate(
        startZoned.year,
        startZoned.month,
        startZoned.day,
      )
      startTime.value = new Time(startZoned.hour, startZoned.minute)
      endDate.value = new CalendarDate(
        endZoned.year,
        startZoned.month,
        startZoned.day,
      )
      endTime.value = new Time(endZoned.hour, endZoned.minute)
      selectedProject.value = participateProjects.value.find(
        (project) => project.value == newEvent.projectId,
      )
      invitees.value = newEvent.meetingParticipants.map((participant) => ({
        label: participant.user.name,
        value: String(participant.user.id),
      }))
      taskId.value = newEvent.id
    } else {
      title.value = ''
      description.value = ''
      isAllDay.value = false
      startDate.value = today(TIMEZONE)
      startTime.value = now(TIMEZONE)
      endDate.value = today(TIMEZONE)
      endTime.value = now(TIMEZONE)
    }
  },
  {
    immediate: true,
    deep: true,
  },
)

watch(selectedProject, () => {
  if (props.eventType === 'Meeting') {
    const newProjectId = selectedProject.value.value
    fetchParticipants(newProjectId)
  }
})

watch(
  () => props.isModalOpen,
  (newValue) => {
    if (newValue == false) {
      title.value = ''
      description.value = ''
      startDate.value = today(TIMEZONE)
      endDate.value = today(TIMEZONE)
      startTime.value = now(TIMEZONE)
      endTime.value = now(TIMEZONE)
      isAllDay.value = false
      currentStep.value = 0
    }
  },
)
</script>

<template>
  <UModal
    :open="isModalOpen"
    :ui="{
      container: 'items-start sm:items-center',
      header: 'flex justify-center p-4',
      body: 'p-4',
      footer: 'p-4 flex justify-end gap-3',
    }"
    isDismissable="{false}"
  >
    <template #header>
      <h3 class="text-xl font-bold text-center text-primary-400"
        >{{ operation }} {{ eventType }}</h3
      >
    </template>

    <template #body class="space-y-6">
      <div v-if="eventType === 'Meeting'">
        <UStepper
          v-model="currentStep"
          :items="stepperItems"
          class="max-w-xl mx-auto"
        >
          <template #details>
            <div class="space-y-6 p-4 sm:p-6">
              <UFormField label="Title" required>
                <UInput v-model="title" placeholder="Enter meeting title" />
              </UFormField>
              <UFormField label="Description (Optional)">
                <UTextarea
                  v-model="description"
                  placeholder="Enter meeting description"
                />
              </UFormField>

              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Start Date" required>
                  <UInputDate
                    v-model="startDate"
                    :popper="{ placement: 'bottom-start' }"
                  >
                  </UInputDate>
                </UFormField>
                <UFormField label="Start Time" required>
                  <UInputTime
                    hideTimeZone
                    :hour-cycle="24"
                    v-model="startTime"
                  />
                </UFormField>
                <UFormField label="End Date" required>
                  <UInputDate
                    v-model="endDate"
                    :popper="{ placement: 'bottom-start' }"
                  >
                  </UInputDate>
                </UFormField>
                <UFormField label="End Time" required>
                  <UInputTime hideTimeZone :hour-cycle="24" v-model="endTime" />
                </UFormField>
              </div>

              <UFormField label="Select Project" required>
                <UInputMenu
                  v-model="selectedProject"
                  :items="participateProjects"
                />
              </UFormField>
            </div>
          </template>

          <template #people>
            <UFormField
              label="Select team members to invite to this Meeting."
              required
            >
              <UInputMenu v-model="invitees" :items="allUsers" multiple />
            </UFormField>
          </template>

          <template #summary>
            <div class="space-y-4 p-4 sm:p-6">
              <h4
                class="text-xl font-bold border-b border-gray-700 pb-3 text-primary-400"
              >
                <UIcon name="i-lucide-list-checks" class="w-5 h-5 mr-2" />
                Meeting Summary
              </h4>

              <div class="space-y-4 text-gray-300">
                <div class="space-y-2 pb-3 border-b border-gray-800">
                  <div class="flex items-center justify-between">
                    <span class="font-semibold text-gray-100">Event Type:</span>
                    <UBadge variant="solid" size="md">{{ eventType }}</UBadge>
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="font-semibold text-gray-100">Project:</span>
                    <UBadge color="neutral" variant="subtle" size="md">{{
                      selectedProject.label
                    }}</UBadge>
                  </div>

                  <p class="flex items-center justify-between">
                    <span class="font-semibold text-gray-100">Title:</span>
                    <UBadge
                      color="neutral"
                      variant="subtle"
                      class="ml-4 break-all max-w-xs"
                      >{{ title || 'Nincs cím megadva' }}</UBadge
                    >
                  </p>

                  <p class="flex items-center justify-between">
                    <span class="font-semibold text-gray-100"
                      >Description:</span
                    >
                    <UBadge
                      color="neutral"
                      variant="subtle"
                      size="md"
                      class="ml-4 break-all max-w-xs"
                      >{{ description || 'Nincs leírás' }}</UBadge
                    >
                  </p>
                </div>

                <h5 class="text-base font-semibold text-gray-100">
                  <UIcon name="i-lucide-clock" class="w-4 h-4 mr-1" /> Timing
                </h5>

                <p class="ml-4 flex items-center justify-between">
                  <span class="font-medium text-green-400">Start:</span>
                  <UBadge color="success" variant="subtle" size="lg">{{
                    startDate.toString() +
                    ` ${String(startTime.hour).padStart(2, '0')}:${String(
                      startTime.minute,
                    ).padStart(2, '0')}`
                  }}</UBadge>
                </p>

                <p class="ml-4 flex items-center justify-between">
                  <span class="font-medium text-red-400">End:</span>
                  <UBadge color="error" variant="subtle" size="lg">{{
                    endDate.toString() +
                    ` ${String(endTime.hour).padStart(2, '0')}:${String(
                      endTime.minute,
                    ).padStart(2, '0')}`
                  }}</UBadge>
                </p>

                <h5
                  class="pt-3 font-semibold text-gray-100 border-t border-gray-800"
                >
                  <UIcon name="i-lucide-users" class="w-4 h-4 mr-1" />
                  Participants
                </h5>
                <p class="ml-4 flex items-center justify-between">
                  <span class="font-medium text-gray-200">Invitees:</span>
                  <UBadge color="primary" variant="outline" class="ml-2">
                    {{ invitees.length || 0 }} people
                  </UBadge>
                </p>
              </div>

              <UAlert
                v-if="!title || invitees.length === 0"
                icon="i-lucide-alert-triangle"
                color="warning"
                variant="subtle"
                title="Missing Data"
                :description="
                  !title
                    ? 'Title is required.'
                    : invitees.length === 0
                    ? 'No participants selected.'
                    : ''
                "
              />
            </div>
          </template>
        </UStepper>
      </div>

      <div v-else class="space-y-6 p-4 sm:p-6">
        <div v-if="eventType !== 'Vacation'" class="space-y-4">
          <UFormField label="Title" required>
            <UInput v-model="title" :placeholder="`Enter ${eventType} title`" />
          </UFormField>
          <UFormField label="Description (Optional)">
            <UTextarea
              v-model="description"
              :placeholder="`Enter ${eventType} description`"
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Start Date" required>
            <UInputDate
              v-model="startDate"
              :popper="{ placement: 'bottom-start' }"
            >
            </UInputDate>
          </UFormField>
          <UFormField v-if="eventType === 'Event'" label="Start Time" required>
            <UInputTime
              :disabled="isAllDay"
              hideTimeZone
              :hour-cycle="24"
              v-model="startTime"
            />
          </UFormField>
          <UFormField label="End Date" required>
            <UInputDate
              v-model="endDate"
              :popper="{ placement: 'bottom-start' }"
            >
            </UInputDate>
          </UFormField>
          <UFormField v-if="eventType === 'Event'" label="End Time" required>
            <UInputTime
              :disabled="isAllDay"
              hideTimeZone
              :hour-cycle="24"
              v-model="endTime"
            />
          </UFormField>
        </div>

        <UCheckbox
          v-if="eventType === 'Event'"
          v-model="isAllDay"
          name="isAllDay"
          size="lg"
          label="All Day"
          @change="isAllDayChanged"
        />
      </div>
    </template>

    <template #footer>
      <div v-if="eventType === 'Meeting'">
        <div class="flex justify-between w-full">
          <UButton
            v-if="currentStep > 0"
            color="neutral"
            variant="soft"
            label="Back"
            icon="i-lucide-arrow-left"
            @click="prevStep"
          />
          <span v-else></span>

          <div class="space-x-3">
            <UButton
              color="neutral"
              variant="soft"
              label="Cancel"
              @click="cancel"
            />
            <UButton
              v-if="currentStep < stepperItems.length - 1"
              color="primary"
              label="Next"
              icon-trailing="i-lucide-arrow-right"
              @click="nextStep"
            />
            <UButton v-else color="primary" label="Save" @click="nextStep" />
          </div>
        </div>
      </div>
      <div v-else>
        <div class="flex justify-end w-full space-x-3">
          <UButton
            color="neutral"
            variant="soft"
            label="Cancel"
            @click="cancel"
          />
          <UButton color="primary" variant="solid" label="Save" @click="save" />
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped></style>
