<script setup lang="ts">
import { ref, watch } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import EventCreationModal from "~/components/EventCreationModal.vue";

const { data: events, refresh: refreshEvents } = await useFetch('/api/events');


const isWeeklyView = ref(true);
const isModalOpen = ref(false);
const fullCalendar = ref(null);
const eventType = ref('');
const selectedEvent = ref({});
const calendarOptions = ref({
  plugins: [timeGridPlugin, dayGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
  buttonText: { today: 'Today' },
  expandRows: true,
  firstDay: 1,
  timeZone:'local',
  forceEventDuration: true,
  eventClick: function eventClick(info){
    setEventById(info.event.id)
  }
});
const menuItems = ref([
  [
    {
      label: 'Event',
      icon: 'i-lucide-code',
      color: 'primary',
      onSelect: () => openModal('Event')
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
type TaskTypeString = 'VACATION' | 'MEETING' | 'TASK' | 'EVENT';
const getEventColor = (type: TaskTypeString): string => {
  switch (type) {
    case 'MEETING':
      return '#36a2eb'; // Kék
    case 'VACATION':
      return '#ff6384'; // Piros
    case 'TASK':
      return '#ff9f40'; // Narancs
    default:
      return '#4bc0c0'; // Zöld
  }
};

function setEventById(id: number){
  if(eventType !== 'Vacation') {
    const eventList = events.value;

    if (!eventList || eventList.length === 0) {
      console.warn('Event list is empty or not yet loaded.');
      return undefined;
    }
    selectedEvent.value = eventList.find(event => event.id == id);
    switch(selectedEvent.value.type){
      case 'EVENT': eventType.value = 'Event'; isModalOpen.value= true; break;
      case 'MEETING': eventType.value = 'Meeting'; isModalOpen.value= true; break;
      case 'TASK': eventType.value = 'Task'; isModalOpen.value= true; break;
      case 'VACATION': eventType.value = 'Vacation'; break;
    }
  }
}

function toggleView() {
  const calendarApi = fullCalendar.value.getApi();
  calendarApi.changeView(isWeeklyView.value ? 'timeGridWeek' : 'dayGridMonth');
}

function openModal(event: string) {
  eventType.value = event;
  isModalOpen.value=true;
}

function eventCreatedOrCanceled(){
  const selectedEvent = ref({});
  refreshEvents()
}


watch(isWeeklyView, () => {
  toggleView();
});

watch(events, (nyersTasks) => {
    let transformedEvents = [];

    if (nyersTasks && nyersTasks.length > 0) {
      transformedEvents = nyersTasks.map(task => {
        let startDate = task.startDate ? new Date(task.startDate) : null;
        let start = startDate ? startDate.toISOString() : null
        let endDate = task.endDate ? new Date(task.endDate) : null;
        let end = endDate ? endDate.toISOString() : null;
        let isFullDay = false;

        if (startDate && endDate) {
          const isStartMidnight = startDate.getUTCHours() === 23 && startDate.getUTCMinutes() === 0;
          const isEndEndOfDay = endDate.getUTCHours() === 22 && endDate.getUTCMinutes() >= 59;
          if (isStartMidnight && isEndEndOfDay) {
            isFullDay = true;
            startDate.setUTCDate(startDate.getUTCDate()+1);
            start =  startDate.toISOString().split('T')[0]
            endDate.setUTCDate(endDate.getUTCDate()+1);
            end = endDate.toISOString().split('T')[0]
          }
        }

        return {
          title: task.name || `${task.type}`,
          start: start,
          end: end,
          color: getEventColor(task.type as TaskTypeString),
          id: String(task.id),
          allDay: isFullDay
        };
      });
    }

    calendarOptions.value.events=transformedEvents
  },
  { immediate: true, deep: true }
);


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

    <EventCreationModal v-model:isModalOpen="isModalOpen" v-model:event-type="eventType" v-model:selected-event="selectedEvent" @created="eventCreatedOrCanceled()" @cancel = "eventCreatedOrCanceled"></EventCreationModal>


  </div>
</template>