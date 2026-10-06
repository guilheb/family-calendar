<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useCalendars, startCalendarSync } from './composables/useCalendars'
import MiniMonth from './components/MiniMonth.vue'
import UpcomingList from './components/UpcomingList.vue'
import CalendarView from './components/CalendarView.vue'
import EventDetail from './components/EventDetail.vue'

const { selectedEvent, selectEvent } = useCalendars()

// Date the main view is centered on, and its display mode.
const viewDate = ref(new Date())
const viewMode = ref('month')

function showWeek(day) {
  viewDate.value = day
  viewMode.value = 'week'
}

function openEvent(ev) {
  selectEvent(ev)
  viewDate.value = ev.start
}

let stop
onMounted(() => (stop = startCalendarSync()))
onUnmounted(() => stop?.())
</script>

<template>
  <div class="app" :class="{ 'has-detail': selectedEvent }">
    <aside class="sidebar">
      <MiniMonth :date="viewDate" class="panel" @pick="showWeek" />
      <UpcomingList class="panel upcoming" :selected="selectedEvent" @select="openEvent" />
    </aside>

    <main class="panel main">
      <CalendarView
        v-model:date="viewDate"
        v-model:mode="viewMode"
        :selected="selectedEvent"
        @select="selectEvent"
      />
    </main>

    <aside v-if="selectedEvent" class="detail">
      <EventDetail :event="selectedEvent" @close="selectEvent(null)" />
    </aside>
  </div>
</template>

<style scoped>
.app {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 12px;
  height: 100vh;
  padding: 12px;
}

.app.has-detail {
  grid-template-columns: 300px minmax(0, 1fr) 340px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.upcoming {
  flex: 1;
  min-height: 0;
}

.main,
.detail {
  min-height: 0;
}

@media (max-width: 1200px) {
  .app,
  .app.has-detail {
    grid-template-columns: 280px minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
  }
  .detail {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .app {
    display: flex;
    flex-direction: column;
    height: auto;
  }
  .upcoming {
    max-height: 60vh;
  }
  .main {
    height: 80vh;
  }
}
</style>
