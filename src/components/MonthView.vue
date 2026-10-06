<script setup>
import { computed } from 'vue'
import { useCalendars } from '../composables/useCalendars'
import {
  monthGrid, sameDay, sameMonth, occursOn, formatShortDate, formatWeekdayShort, formatTime,
} from '../utils/date'

const MAX_VISIBLE = 4

const props = defineProps({ date: { type: Date, required: true }, selected: Object })
const emit = defineEmits(['select', 'show-day'])

const { events, calendarById, now } = useCalendars()

const days = computed(() => {
  const grid = monthGrid(props.date)
  return grid.map((day) => {
    const dayEvents = events.value.filter((e) => occursOn(e, day))
    const overflow = dayEvents.length > MAX_VISIBLE
    return {
      day,
      // Show "1 oct." on the first of each month, like Apple Calendar.
      label: day.getDate() === 1 ? formatShortDate(day) : String(day.getDate()),
      events: overflow ? dayEvents.slice(0, MAX_VISIBLE - 1) : dayEvents,
      more: overflow ? dayEvents.length - (MAX_VISIBLE - 1) : 0,
      outside: !sameMonth(day, props.date),
      today: sameDay(day, now.value),
    }
  })
})

const weeks = computed(() => days.value.length / 7)
const headers = computed(() => days.value.slice(0, 7).map((d) => formatWeekdayShort(d.day)))
</script>

<template>
  <div class="month">
    <div class="headers">
      <span v-for="h in headers" :key="h">{{ h }}</span>
    </div>

    <div class="grid" :style="{ gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))` }">
      <div
        v-for="d in days"
        :key="d.day.getTime()"
        class="cell"
        :class="{ outside: d.outside, today: d.today }"
      >
        <button class="num" @click="emit('show-day', d.day)">{{ d.label }}</button>

        <button
          v-for="ev in d.events"
          :key="ev.id"
          class="ev"
          :class="{ selected: selected?.id === ev.id, allday: ev.allDay }"
          :style="{ '--c': calendarById[ev.calendarId]?.color }"
          :title="`${ev.title}${ev.allDay ? '' : ' · ' + formatTime(ev.start)}`"
          @click="emit('select', ev)"
        >
          <span class="dot" />
          <span class="truncate">{{ ev.title }}</span>
        </button>

        <button v-if="d.more" class="more" @click="emit('show-day', d.day)">+{{ d.more }} autres</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.month {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.headers {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  padding: 6px 0;
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  border-bottom: 1px solid var(--border);
}

.grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  min-height: 0;
}

.cell {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-height: 90px;
  padding: 4px 4px 6px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  overflow: hidden;
}

.cell:nth-child(7n) {
  border-right: 0;
}

.outside {
  background: color-mix(in srgb, var(--card) 50%, transparent);
}

.num {
  align-self: flex-end;
  min-width: 28px;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 17px;
  text-align: center;
}

.num:hover {
  background: var(--card);
}

.outside .num {
  color: var(--muted);
}

.today {
  background: color-mix(in srgb, var(--accent) 7%, transparent);
}

.today .num,
.today .num:hover {
  background: var(--accent);
  color: #fff;
  font-weight: 600;
}

.ev {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  padding: 1px 4px;
  border-radius: 5px;
  font-size: 12.5px;
  text-align: left;
}

.ev:hover {
  background: var(--card);
}

.ev .dot {
  background: var(--c);
}

.ev.allday {
  background: color-mix(in srgb, var(--c) 30%, transparent);
}

.ev.allday .dot {
  display: none;
}

.ev.selected {
  background: var(--c);
  color: #fff;
}

.ev.selected .dot {
  background: #fff;
}

.more {
  padding: 1px 4px;
  font-size: 11.5px;
  color: var(--muted);
  text-align: left;
}

.more:hover {
  color: var(--accent);
}
</style>
