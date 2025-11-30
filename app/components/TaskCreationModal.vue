<script setup lang="ts">
import {ref, shallowRef} from "vue";
import {now, Time, today} from "@internationalized/date";
import type {TaskCreationDto} from "~~/types/task-creation-dto";
import type {ExtendedUser} from "~~/types/extended-user";

const { data: session } = useAuth()
const user = computed(() => session.value?.user as ExtendedUser | undefined)
const participantId = ref<number | undefined>(undefined);

watch(user, (newUser) => {
  if (newUser?.id && participantId.value !== newUser.id) {
    participantId.value = newUser.id;
  }
}, { immediate: true });

const props= defineProps({
  isModalOpen: {
    type: Boolean,
    default: false
  },
  eventType: {
    type: String,
    default:'Task'
  }
});

const emit = defineEmits<{
  (e: 'update:isModalOpen', value: boolean): void;
}>();

const toast = useToast()
const title = ref('');
const description = ref('');
const startDate = shallowRef(today());
const startTime = shallowRef(now());
const endDate = shallowRef(today());
const endTime = shallowRef(now());
const isAllDay = ref(false);
const currentStep = ref(0);
const allUsers = ['John Doe','Jane Smith','Robert Brown']
const invitees = ref([])
const { data: participatedProjects} = await useFetch('/api/projects', {
  query: computed(() => {
    if (!participantId.value) return {}
    return { participantId: participantId.value }
  }),
})
const projectsOptions = ref ([])
const selectedProjectId =ref<number | undefined>(undefined);
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
  }
]);

function nextStep() {
  if (currentStep.value < stepperItems.value.length - 1) {
    currentStep.value++;
  } else {
    save();
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

function cancel() {
  emit('update:isModalOpen', false)
  currentStep.value = 0;
}

async function save(){
  try {
    const startDateString = startDate.value.toString();
    const formattedStartTime = `${String(startTime.value.hour).padStart(2, '0')}:${String(startTime.value.minute).padStart(2, '0')}`;
    const isoStartString = `${startDateString}T${formattedStartTime}:00`;

    const endDateString = endDate.value.toString();
    const formattedEndTime = `${String(endTime.value.hour).padStart(2, '0')}:${String(endTime.value.minute).padStart(2, '0')}`;
    const isoEndString = `${endDateString}T${formattedEndTime}:00`;

    const dto: TaskCreationDto = {
      type: props.eventType,
      name: title.value,
      description: description.value,
      startDate: isoStartString,
      endDate: isoEndString,
      projectName: null
    }

    console.log('dto: ', dto)

    const task = await $fetch('/api/tasks', {
      method: 'POST',
      body: dto
    })

    toast.add({
      title: 'Success',
      description: 'Task created successfully',
      color: 'primary',
      icon: 'i-heroicons-check-circle'
    })


    console.log('Event Saved Successfully');

    // Ide jönne a FullCalendar API hívása (addEvent)
    // Ideális esetben a FullCalendar-t frissítenénk az új eseménnyel.


    emit('update:isModalOpen', false)
    currentStep.value = 0;

  } catch (error) {
    console.error('Error saving event:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to create task. Please try again.',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    })
  }
}

function isAllDayChanged() {
  if (isAllDay.value) {
    startTime.value = new Time(0, 0);
    endTime.value = new Time(0, 0);
  } else {
    startTime.value = now();
    endTime.value = now();
  }
}


watch(selectedProjectId, (newProject) => {
  // Ezen a ponton szimulálnánk az API hívást,
  // ami lekéri a projekthez tartozó embereket.
  console.log(`Fetching users for project: ${newProject}`);
  // Ha szükséges, frissítené az allUsers ref-et.
});

watch(
    () => props.isModalOpen,
    (newValue) => {
      if(newValue == false){
        title.value = '';
        description.value = '';
        startDate.value = today();
        endDate.value = today();
        startTime.value = now();
        endTime.value = now();
        isAllDay.value = false;
        currentStep.value = 0;
      }
    }
);

watch(participatedProjects, (newProjects) => {
  console.log('newProjects', newProjects)
  if (newProjects && newProjects.length > 0) {
    selectedProjectId.value = newProjects[0].id;
    projectsOptions.value = participatedProjects.value
  }
}, { immediate: true });


</script>

<template>
  <UModal :open="isModalOpen" :ui="{container: 'items-start sm:items-center', header: 'flex justify-center p-4', body: 'p-4', footer: 'p-4 flex justify-end gap-3'}" isDismissable={false}>

    <template #header>
      <h3 class="text-xl font-bold text-center text-primary-400">Create New {{ eventType }}</h3>
    </template>

    <template #body class="space-y-6">
      <div v-if="eventType === 'Meeting'">
        <UStepper v-model="currentStep" :items="stepperItems" class="max-w-xl mx-auto">

          <template #details>
            <div class="space-y-6 p-4 sm:p-6">
              <UFormField label="Title" required>
                <UInput v-model="title" placeholder="Enter meeting title" />
              </UFormField>
              <UFormField label="Description (Optional)">
                <UTextarea v-model="description" placeholder="Enter meeting description" />
              </UFormField>

              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Start Date" required>
                  <UInputDate v-model="startDate" :popper="{ placement: 'bottom-start' }">
                  </UInputDate>
                </UFormField>
                <UFormField label="Start Time" required>
                  <UInputTime hideTimeZone :hour-cycle="24" v-model="startTime"/>
                </UFormField>
                <UFormField label="End Date" required>
                  <UInputDate v-model="endDate" :popper="{ placement: 'bottom-start' }">
                  </UInputDate>
                </UFormField>
                <UFormField label="End Time" required>
                  <UInputTime hideTimeZone :hour-cycle="24" v-model="endTime"/>
                </UFormField>
              </div>

              <UFormField label="Select Project" required>
                <UInputMenu v-model="selectedProjectId" :options="projectsOptions" value-attribute="id" option-attribute="name" :key="projectsOptions.length"/>
              </UFormField>
            </div>
          </template>

          <template #people>
            <UFormField label="Select team members to invite to this Meeting." required>
              <UInputMenu v-model="invitees" :items="allUsers" multiple/>
            </UFormField>
          </template>

          <template #summary>
            <div class="space-y-4 p-4 sm:p-6">

              <h4 class="text-xl font-bold border-b border-gray-700 pb-3 text-primary-400">
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
                    <UBadge color="neutral" variant="subtle" size="md">{{ selectedProject }}</UBadge>
                  </div>

                  <p class="flex items-center justify-between">
                    <span class="font-semibold text-gray-100">Title:</span>
                    <UBadge color="neutral" variant="subtle" class="ml-4 break-all max-w-xs" >{{ title || 'Nincs cím megadva' }}</UBadge>
                  </p>

                  <p class="flex items-center justify-between">
                    <span class="font-semibold text-gray-100">Description:</span>
                    <UBadge color="neutral" variant="subtle" size="md" class="ml-4 break-all max-w-xs">{{ description || 'Nincs leírás' }}</UBadge>
                  </p>
                </div>

                <h5 class="text-base font-semibold text-gray-100">
                  <UIcon name="i-lucide-clock" class="w-4 h-4 mr-1"/> Timing
                </h5>

                <p class="ml-4 flex items-center justify-between">
                  <span class="font-medium text-green-400">Start:</span>
                  <UBadge color="success" variant="subtle" size="lg">{{ startDate.toString() + ` ${String(startTime.hour).padStart(2, '0')}:${String(startTime.minute).padStart(2, '0')}` }}</UBadge>
                </p>

                <p class="ml-4 flex items-center justify-between">
                  <span class="font-medium text-red-400">End:</span>
                  <UBadge color="error" variant="subtle" size="lg">{{ endDate.toString() + ` ${String(endTime.hour).padStart(2, '0')}:${String(endTime.minute).padStart(2, '0')}` }}</UBadge>
                </p>

                <h5 class="pt-3 font-semibold text-gray-100 border-t border-gray-800">
                  <UIcon name="i-lucide-users" class="w-4 h-4 mr-1"/> Participants
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
                  :description="!title ? 'Title is required.' : (invitees.length === 0 ? 'No participants selected.' : '')"
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
            <UTextarea v-model="description" :placeholder="`Enter ${eventType} description`" />
          </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Start Date" required>
            <UInputDate v-model="startDate" :popper="{ placement: 'bottom-start' }">
            </UInputDate>
          </UFormField>
          <UFormField v-if="eventType === 'Task'" label="Start Time" required>
            <UInputTime :disabled="isAllDay" hideTimeZone :hour-cycle="24" v-model="startTime"/>
          </UFormField>
          <UFormField label="End Date" required>
            <UInputDate v-model="endDate" :popper="{ placement: 'bottom-start' }">
            </UInputDate>
          </UFormField>
          <UFormField v-if="eventType === 'Task'" label="End Time" required>
            <UInputTime :disabled="isAllDay" hideTimeZone :hour-cycle="24" v-model="endTime"/>
          </UFormField>
        </div>


        <UCheckbox v-if="eventType==='Task'" v-model="isAllDay" name="isAllDay" size="lg" label="All Day" @change="isAllDayChanged" />

        <UFormField v-if="eventType === 'Task'" label="Select Project">
          <UInputMenu v-model="selectedProjectId" :options="projectsOptions" value-attribute="id" option-attribute="name"/>
        </UFormField>

      </div>
    </template>

    <template #footer>
      <div v-if="eventType === 'Meeting'">
        <div class="flex justify-between w-full">
          <UButton v-if="currentStep > 0" color="gray" variant="soft" label="Back" icon="i-lucide-arrow-left" @click="prevStep"/>
          <span v-else></span>

          <div class="space-x-3">
            <UButton color="gray" variant="soft" label="Cancel" @click="cancel" />
            <UButton
                v-if="currentStep < stepperItems.length - 1"
                color="primary"
                label="Next"
                icon-trailing="i-lucide-arrow-right"
                @click="nextStep"
            />
            <UButton
                v-else
                color="primary"
                label="Save"
                @click="nextStep"
            />
          </div>
        </div>
      </div>
      <div v-else>
        <div class="flex justify-end w-full space-x-3">
          <UButton color="gray" variant="soft" label="Cancel" @click="cancel" />
          <UButton color="primary" variant="solid" label="Save" @click="save" />
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>

</style>