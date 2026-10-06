<script setup>
import { ref, computed, watch } from 'vue'
import { useCalendars } from '../composables/useCalendars'
import {
  monthGrid, weekDays, addMonths, startOfMonth, sameDay, sameMonth, occursOn,
  formatMonthYear, formatWeekdayShort, capitalize,
} from '../utils/date'

const MAX_DOTS = 3

const props = defineProps({ date: { type: Date, required: true } })
const emit = defineEmits(['pick'])
const { events, calendarById, now } = useCalendars()

// Month displayed here; follows the main view but can be browsed independently.
const month = ref(startOfMonth(props.date))
watch(() => props.date, (d) => {
  if (!sameMonth(d, month.value)) month.value = startOfMonth(d)
})

const headers = computed(() => weekDays(new Date()).map((d) => formatWeekdayShort(d)))

const days = computed(() =>
  monthGrid(month.value).map((day) => {
    const dayEvents = events.value.filter((e) => occursOn(e, day))
    return {
      day,
      dots: dayEvents.slice(0, MAX_DOTS).map((e) => calendarById.value[e.calendarId]?.color),
      more: dayEvents.length > MAX_DOTS,
      outside: !sameMonth(day, month.value),
      today: sameDay(day, now.value),
      selected: sameDay(day, props.date),
    }
  }),
)
</script>

<template>
  <section class="mini">
    <header>
      <strong>{{ capitalize(formatMonthYear(month)) }}</strong>
      <div>
        <button class="icon-btn" aria-label="Mois précédent" @click="month = addMonths(month, -1)">‹</button>
        <button class="icon-btn" aria-label="Mois suivant" @click="month = addMonths(month, 1)">›</button>
      </div>
    </header>

    <div class="grid">
      <span v-for="h in headers" :key="h" class="weekday">{{ h }}</span>
      <button
        v-for="d in days"
        :key="d.day.getTime()"
        class="day"
        :class="{ outside: d.outside, today: d.today, selected: d.selected }"
        @click="emit('pick', d.day)"
      >
        <span class="num">{{ d.day.getDate() }}</span>
        <span class="dots">
          <span v-for="(c, i) in d.dots" :key="i" class="dot" :style="{ background: c }" />
          <span v-if="d.more" class="plus">+</span>
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.mini {
  padding: 10px 12px 12px;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 6px;
  font-size: 15px;
}

header .icon-btn {
  font-size: 20px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 2px;
  text-align: center;
}

.weekday {
  font-size: 11px;
  color: var(--muted);
  padding-bottom: 4px;
}

.day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 0 3px;
  border-radius: 9px;
}

.day:hover {
  background: var(--card);
}

.num {
  font-size: 16px;
  line-height: 1.2;
}

.outside .num {
  color: var(--faint);
}

.today .num {
  color: var(--accent);
  font-weight: 600;
}

.selected {
  background: var(--accent);
}

.selected:hover {
  background: var(--accent);
}

.selected .num {
  color: #fff;
  font-weight: 600;
}

.selected .dot {
  background: #fff !important;
}

.dots {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 6px;
}

.dots .dot {
  width: 5px;
  height: 5px;
}

.outside .dots {
  opacity: 0.4;
}

.plus {
  font-size: 9px;
  line-height: 1;
  color: var(--muted);
}

.selected .plus {
  color: #fff;
}
</style>
