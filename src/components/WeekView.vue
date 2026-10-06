<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import { useCalendars } from '../composables/useCalendars'
import {
  weekDays, addDays, startOfDay, sameDay, occursOn, formatWeekdayShort, formatTime, formatHour,
} from '../utils/date'

const HOUR_PX = 96
const MIN_EVENT_PX = 36
// The grid opens scrolled to this hour; earlier events are rarely of interest.
const FIRST_HOUR = 6

const props = defineProps({ date: { type: Date, required: true }, selected: Object })
const emit = defineEmits(['select'])

const { events, calendarById, now } = useCalendars()

const hours = Array.from({ length: 24 }, (_, h) => formatHour(new Date(2000, 0, 1, h)))
const scroller = ref(null)

// Lays out one day's timed events: overlapping events share the width in columns.
function layoutDay(day) {
  const dayStart = startOfDay(day)
  const dayEnd = addDays(dayStart, 1)
  const items = events.value
    .filter((e) => !e.allDay && occursOn(e, day))
    .map((ev) => {
      const s = Math.max(ev.start, dayStart)
      const e = Math.min(Math.max(ev.end, ev.start.getTime() + 30 * 60_000), dayEnd)
      return { ev, s, e, col: 0, cols: 1 }
    })

  let cluster = []
  let clusterEnd = 0
  const flush = () => {
    const columns = []
    for (const it of cluster) {
      let c = columns.findIndex((end) => end <= it.s)
      if (c === -1) c = columns.length
      columns[c] = it.e
      it.col = c
    }
    for (const it of cluster) it.cols = columns.length
    cluster = []
  }
  for (const it of items) {
    if (cluster.length && it.s >= clusterEnd) flush()
    cluster.push(it)
    clusterEnd = Math.max(clusterEnd, it.e)
  }
  flush()

  return items.map((it) => ({
    ev: it.ev,
    style: {
      top: `${((it.s - dayStart) / 3_600_000) * HOUR_PX}px`,
      height: `${Math.max(((it.e - it.s) / 3_600_000) * HOUR_PX - 2, MIN_EVENT_PX)}px`,
      left: `${(it.col / it.cols) * 100}%`,
      width: `${100 / it.cols}%`,
      '--c': calendarById.value[it.ev.calendarId]?.color,
    },
  }))
}

const days = computed(() =>
  weekDays(props.date).map((day) => ({
    day,
    today: sameDay(day, now.value),
    allDay: events.value.filter((e) => e.allDay && occursOn(e, day)),
    timed: layoutDay(day),
  })),
)

const hasAllDay = computed(() => days.value.some((d) => d.allDay.length))

const nowTop = computed(() => ((now.value - startOfDay(now.value)) / 3_600_000) * HOUR_PX)

onMounted(async () => {
  await nextTick()
  // Leave room above the line so the hour label isn't clipped.
  scroller.value.scrollTop = FIRST_HOUR * HOUR_PX - 12
})
</script>

<template>
  <div class="week">
    <div class="row head">
      <div class="gutter" />
      <div v-for="d in days" :key="d.day.getTime()" class="dayhead" :class="{ today: d.today }">
        {{ formatWeekdayShort(d.day) }} <span class="num">{{ d.day.getDate() }}</span>
      </div>
    </div>

    <div v-if="hasAllDay" class="row allday">
      <div class="gutter label">journée</div>
      <div v-for="d in days" :key="d.day.getTime()" class="allday-cell">
        <button
          v-for="ev in d.allDay"
          :key="ev.id"
          class="chip truncate"
          :class="{ selected: selected?.id === ev.id }"
          :style="{ '--c': calendarById[ev.calendarId]?.color }"
          @click="emit('select', ev)"
        >{{ ev.title }}</button>
      </div>
    </div>

    <div ref="scroller" class="scroll">
      <div class="row body" :style="{ height: `${24 * HOUR_PX}px` }">
        <div class="gutter hours">
          <span v-for="(h, i) in hours" :key="i" :style="{ top: `${i * HOUR_PX}px` }">{{ i ? h : '' }}</span>
        </div>

        <div v-for="d in days" :key="d.day.getTime()" class="col" :class="{ today: d.today }">
          <div v-for="i in 24" :key="i" class="line" :style="{ top: `${i * HOUR_PX}px` }" />
          <div v-if="d.today" class="now" :style="{ top: `${nowTop}px` }" />

          <div class="events">
            <button
              v-for="{ ev, style } in d.timed"
              :key="ev.id"
              class="event"
              :class="{ selected: selected?.id === ev.id, past: ev.end < now }"
              :style="style"
              @click="emit('select', ev)"
            >
              <span class="title">{{ ev.title }}</span>
              <span class="time">{{ formatTime(ev.start) }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.week {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.row {
  display: grid;
  grid-template-columns: 52px repeat(7, minmax(0, 1fr));
}

.head {
  border-bottom: 1px solid var(--border);
}

.dayhead {
  padding: 8px 0;
  text-align: center;
  font-size: 13px;
  color: var(--muted);
}

.dayhead .num {
  display: inline-block;
  min-width: 26px;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 16px;
  color: var(--text);
}

.dayhead.today .num {
  background: var(--accent);
  color: #fff;
  font-weight: 600;
}

.allday {
  border-bottom: 1px solid var(--border);
}

.label {
  padding: 6px 6px 0 0;
  font-size: 11px;
  color: var(--muted);
  text-align: right;
}

.allday-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 3px 2px;
  border-left: 1px solid var(--border);
}

.allday .chip {
  padding: 2px 6px;
  border-radius: 5px;
  font-size: 12px;
  text-align: left;
  background: color-mix(in srgb, var(--c) 25%, transparent);
}

.allday .chip.selected {
  background: var(--c);
  color: #fff;
}

.scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.body {
  position: relative;
}

.hours {
  position: relative;
}

.hours span {
  position: absolute;
  right: 6px;
  transform: translateY(-50%);
  font-size: 11px;
  color: var(--muted);
}

.col {
  position: relative;
  border-left: 1px solid var(--border);
}

.col.today {
  background: color-mix(in srgb, var(--accent) 5%, transparent);
}

.line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px solid var(--border);
}

.now {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 2;
  border-top: 2px solid var(--danger);
}

.now::before {
  content: '';
  position: absolute;
  left: -5px;
  top: -6px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--danger);
}

.events {
  position: absolute;
  inset: 0 3px 0 1px;
}

.event {
  position: absolute;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 3px 6px;
  border-radius: 5px;
  border-left: 3px solid var(--c);
  background: color-mix(in srgb, var(--c) 18%, var(--panel));
  font-size: 12px;
  text-align: left;
  line-height: 1.25;
}

.event:hover {
  background: color-mix(in srgb, var(--c) 28%, var(--panel));
}

.event .title {
  font-weight: 600;
}

.event .time {
  color: color-mix(in srgb, var(--c) 70%, var(--text));
}

.event.past {
  opacity: 0.6;
}

.event.selected {
  background: var(--c);
  color: #fff;
  opacity: 1;
}

.event.selected .time {
  color: #fff;
}
</style>
