<script setup>
import { computed } from 'vue'
import { useCalendars } from '../composables/useCalendars'
import {
  addDays, startOfDay, occursOn, sameDay, formatShortDate, formatWeekday, formatTime, capitalize,
} from '../utils/date'

const DAYS_AHEAD = 7

defineProps({ selected: Object })
const emit = defineEmits(['select'])

const { events, calendarById, now } = useCalendars()

const days = computed(() => {
  const today = startOfDay(now.value)
  return Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const day = addDays(today, i)
    return {
      day,
      today: i === 0,
      label: i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain' : capitalize(formatWeekday(day)),
      events: events.value.filter((e) => occursOn(e, day)),
    }
  })
})

function timeRange(ev, day) {
  if (ev.allDay) return 'Toute la journée'
  const startsToday = sameDay(ev.start, day)
  const endsToday = sameDay(ev.end, day) || ev.end.getTime() === addDays(startOfDay(day), 1).getTime()
  const from = startsToday ? formatTime(ev.start) : formatShortDate(ev.start)
  const to = endsToday ? formatTime(ev.end) : formatShortDate(ev.end)
  return ev.start.getTime() === ev.end.getTime() ? from : `${from} – ${to}`
}
</script>

<template>
  <section class="upcoming">
    <div v-for="d in days" :key="d.day.getTime()" class="group">
      <h3>
        <span :class="{ today: d.today }">{{ d.label }}</span>
        <small>{{ formatShortDate(d.day) }}</small>
      </h3>

      <p v-if="!d.events.length" class="empty">Aucun événement</p>

      <button
        v-for="ev in d.events"
        :key="ev.id"
        class="item"
        :class="{ past: ev.end < now, selected: selected?.id === ev.id, allday: ev.allDay }"
        :style="{ '--c': calendarById[ev.calendarId]?.color }"
        @click="emit('select', ev)"
      >
        <span class="dot" />
        <span class="body">
          <span class="title">{{ ev.title }}</span>
          <span class="meta">{{ timeRange(ev, d.day) }}</span>
          <span v-if="ev.location" class="meta">{{ ev.location }}</span>
        </span>
        <span v-if="ev.recurring" class="repeat" title="Récurrent">⟳</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.upcoming {
  overflow-y: auto;
}

h3 {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0;
  padding: 7px 14px;
  font-size: 15px;
  font-weight: 600;
  background: color-mix(in srgb, var(--band) 92%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
}

h3 small {
  font-size: 12px;
  font-weight: 400;
  color: var(--muted);
}

h3 .today {
  color: var(--accent);
}

.empty {
  margin: 0;
  padding: 10px 16px 12px 30px;
  color: var(--muted);
}

.item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 7px 14px;
  text-align: left;
}

.item:hover {
  background: var(--card);
}

.item.selected {
  background: var(--accent-soft);
}

.item .dot {
  margin-top: 6px;
  background: var(--c);
}

.allday {
  margin: 4px 8px;
  width: calc(100% - 16px);
  border-radius: 8px;
  background: color-mix(in srgb, var(--c) 35%, transparent);
}

.allday .dot {
  display: none;
}

.body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.title {
  font-size: 16px;
  line-height: 1.3;
}

.meta {
  font-size: 12px;
  color: var(--muted);
}

.past .title,
.past .meta {
  color: var(--faint);
}

.repeat {
  color: var(--muted);
  font-size: 13px;
}
</style>
