<script setup lang="ts">
import { ref, watch, onMounted, shallowRef } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type {ExtendedUser} from "~~/types/extended-user";
import TaskCreationModal from "~/components/TaskCreationModal.vue";


const { data: session } = useAuth()
const user = computed(() => session.value?.user as ExtendedUser | undefined)

const isWeeklyView = ref(true);
const isModalOpen = ref(false);
const fullCalendar = ref(null);
const eventType = ref('');
const calendarOptions = ref({
  plugins: [timeGridPlugin, dayGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
  buttonText: { today: 'Today' },
  expandRows: true,
  firstDay: 1,
});
const menuItems = ref([
  [
    {
      label: 'Task',
      icon: 'i-lucide-code',
      color: 'primary',
      onSelect: () => openModal('Task')
    },
    {
      label: 'Meeting',
      icon: 'i-lucide-users',
      color: 'primary',
      onSelect: () => openModal('Meeting')
    },
    {
      label: 'Vacation',
      icon: 'mdi-palm-tree',
      color: 'primary',
      onSelect: () => openModal('Vacation')
    }
  ]
]);
const { data: assignedTasks, refresh: refreshTask } = await useFetch('/api/tasks')



function toggleView() {
  const calendarApi = fullCalendar.value.getApi();
  calendarApi.changeView(isWeeklyView.value ? 'timeGridWeek' : 'dayGridMonth');
}

function openModal(event: string) {
  eventType.value = event;
  isModalOpen.value=true;
}



watch(isWeeklyView, () => {
  toggleView();
});

onMounted(() => {
  // A FullCalendar API-t használjuk az események hozzáadásához
  // Bár a tömb módosítás is működik, az API a robusztusabb:
  // Ha nem globális objektum, akkor inicializáljuk a tömböt:
  calendarOptions.value.events = [
    { title: 'Projekt indítás', date: '2025-11-24T11:00:00', color: '#ff6384' },
    { title: 'Tervezés', date: '2025-12-01T14:30:00', color: '#36a2eb' }
  ];
});
</script>

<template>
  <div class="p-5 bg-gray-900 rounded-xl shadow-lg border border-gray-800 text-gray-200 min-h-screen">

    <div class="flex justify-between items-center py-5">

      <div class="flex items-center gap-2 lg:gap-4">
        <UIcon name="i-heroicons-calendar-days" class="text-4xl lg:text-5xl transition-colors" :class="{'text-primary-400': !isWeeklyView,'text-gray-500': isWeeklyView}"/>
        <span class="text-lg lg:text-xl transition-colors" :class="{'font-semibold text-primary-400': !isWeeklyView, 'text-gray-500': isWeeklyView}">Month</span>
        <USwitch v-model="isWeeklyView" :padded="false" size = "xl"/>
        <UIcon name="i-heroicons-calendar" class="text-4xl lg:text-5xl transition-colors" :class="{ 'text-primary-400': isWeeklyView,'text-gray-500': !isWeeklyView}"/>
        <span class="text-lg lg:text-xl transition-colors" :class="{'font-semibold text-primary-400': isWeeklyView, 'text-gray-500': !isWeeklyView}">Week</span>
      </div>

      <div>
        <UDropdownMenu :items="menuItems" size="xl" :content="{align: 'end'}">
          <UButton icon="i-lucide-plus" size="xl" color="primary" variant="solid" label="New Event"/>
        </UDropdownMenu>
      </div>
    </div>

    <div class="mt-4 bg-gray-900 p-2 rounded-lg shadow-inner">
      <FullCalendar :options="calendarOptions" ref="fullCalendar" />
    </div>

    <TaskCreationModal v-model:isModalOpen="isModalOpen" :event-type="eventType"></TaskCreationModal>


  </div>
</template>