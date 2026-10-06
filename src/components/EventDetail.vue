<script setup>
import { computed } from 'vue'
import { useCalendars } from '../composables/useCalendars'
import {
  sameDay, formatLongDate, formatTime, formatDuration, formatRelative, DAY_MS,
} from '../utils/date'

const STATUS_LABELS = { CONFIRMED: 'Confirmé', TENTATIVE: 'Provisoire', CANCELLED: 'Annulé' }

const props = defineProps({ event: Object })
const emit = defineEmits(['close'])

const { calendarById, now } = useCalendars()

const calendar = computed(() => props.event && calendarById.value[props.event.calendarId])

function formatWhen(d, isEnd) {
  const ev = props.event
  // All-day DTEND is exclusive: show the last included day.
  if (ev.allDay) return formatLongDate(isEnd ? new Date(d.getTime() - DAY_MS) : d)
  return `${formatLongDate(d)} à ${formatTime(d)}`
}

const status = computed(() => {
  const ev = props.event
  if (!ev) return null
  const t = now.value
  if (ev.start <= t && t < ev.end) {
    return { label: 'En cours', detail: `encore ${formatDuration(ev.end - t)}`, highlight: true }
  }
  if (t < ev.start) return { label: 'À venir', detail: formatRelative(ev.start, t), highlight: true }
  return { label: 'Terminé', detail: formatRelative(ev.end, t) }
})

const sameDayEvent = computed(() => props.event && sameDay(props.event.start, props.event.end))

// Escape the text, then turn bare URLs into links.
const notesHtml = computed(() => {
  const text = props.event?.description
  if (!text) return ''
  const escaped = text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
  return escaped.replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)\]]/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`)
})
</script>

<template>
  <section class="detail">
    <div v-if="!event" class="placeholder">
      <span>📅</span>
      <p>Sélectionnez un événement pour voir ses détails.</p>
    </div>

    <template v-else>
      <div class="card head" :style="{ '--c': calendar?.color }">
        <div class="title-row">
          <span class="bar" />
          <h2>{{ event.title }}</h2>
          <button class="icon-btn" aria-label="Fermer" @click="emit('close')">✕</button>
        </div>
        <div class="cal">
          <span class="dot" />
          <div>
            <div>{{ calendar?.name }}</div>
            <small>Calendrier abonné</small>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="status" :class="{ highlight: status.highlight }">
          <span>{{ status.label }}</span>
          <span>{{ status.detail }}</span>
        </div>
        <template v-if="event.allDay">
          <div class="line"><span>Toute la journée</span><span>{{ formatWhen(event.start) }}</span></div>
          <div v-if="event.end - event.start > DAY_MS" class="line">
            <span>Jusqu'au</span><span>{{ formatWhen(event.end, true) }}</span>
          </div>
        </template>
        <template v-else>
          <div class="line"><span>Début</span><span>{{ formatWhen(event.start) }}</span></div>
          <div class="line">
            <span>Fin</span>
            <span>{{ sameDayEvent ? formatTime(event.end) : formatWhen(event.end) }}</span>
          </div>
          <div class="line"><span>Durée</span><span>{{ formatDuration(event.end - event.start) }}</span></div>
        </template>
      </div>

      <div v-if="event.location || event.recurring || event.status" class="card">
        <div v-if="event.location" class="line"><span>📍 Lieu</span><span>{{ event.location }}</span></div>
        <div v-if="event.recurring" class="line"><span>⟳ Répétition</span><span>Récurrent</span></div>
        <div v-if="event.status" class="line"><span>Statut</span><span>{{ STATUS_LABELS[event.status.toUpperCase()] ?? event.status }}</span></div>
      </div>

      <template v-if="notesHtml">
        <h3>Notes</h3>
        <div class="card notes" v-html="notesHtml" />
      </template>

      <a v-if="event.url" class="card link" :href="event.url" target="_blank" rel="noopener">🔗 {{ event.url }}</a>
    </template>
  </section>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow-y: auto;
}

.placeholder {
  margin: auto;
  text-align: center;
  color: var(--muted);
}

.placeholder span {
  font-size: 36px;
}

.card {
  padding: 14px 16px;
  border-radius: var(--radius);
  background: var(--panel);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
}

.title-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.bar {
  align-self: stretch;
  width: 4px;
  border-radius: 2px;
  background: var(--c);
}

h2 {
  flex: 1;
  margin: 0;
  font-size: 21px;
  line-height: 1.25;
}

.cal {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding-top: 12px;
  font-size: 16px;
}

.cal .dot {
  margin-top: 7px;
  width: 9px;
  height: 9px;
  background: var(--c);
}

.cal small {
  font-size: 12px;
  color: var(--muted);
}

.status {
  display: flex;
  justify-content: space-between;
  margin: -14px -16px 4px;
  padding: 12px 16px;
  border-radius: var(--radius) var(--radius) 0 0;
  background: var(--band);
  color: var(--muted);
  font-size: 16px;
}

.status.highlight {
  background: var(--accent-soft);
  color: var(--accent);
}

.line {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 0;
  font-size: 15px;
  border-bottom: 1px solid var(--border);
}

.line:first-child {
  padding-top: 0;
}

.line:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.line span:last-child {
  color: var(--muted);
  text-align: right;
}

h3 {
  margin: 4px 0 -6px 4px;
  font-size: 15px;
  color: var(--muted);
}

.notes {
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.notes :deep(a),
.link {
  color: var(--accent);
}

.link {
  overflow-wrap: anywhere;
  text-decoration: none;
}
</style>
