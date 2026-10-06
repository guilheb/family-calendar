export const DAY_MS = 86_400_000

export function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function addMonths(d, n) {
  const x = new Date(d)
  x.setDate(1)
  x.setMonth(x.getMonth() + n)
  return x
}

export function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function startOfWeek(d) {
  const x = startOfDay(d)
  return addDays(x, -x.getDay())
}

export function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function sameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

// Every day shown in a month grid: whole weeks covering the month, Sunday first.
export function monthGrid(d) {
  const first = startOfMonth(d)
  const start = startOfWeek(first)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  const end = addDays(startOfWeek(last), 7)
  const days = []
  for (let x = start; x < end; x = addDays(x, 1)) days.push(x)
  return days
}

export function weekDays(d) {
  const start = startOfWeek(d)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

// True when the event overlaps the given calendar day.
export function occursOn(ev, day) {
  const dayStart = startOfDay(day)
  const dayEnd = addDays(dayStart, 1)
  if (ev.start.getTime() === ev.end.getTime()) return ev.start >= dayStart && ev.start < dayEnd
  return ev.start < dayEnd && ev.end > dayStart
}

// Fixed rather than the browser's locale, so the whole UI is consistently in French.
export const LOCALE = 'fr-CA'

const fmt = (opts) => new Intl.DateTimeFormat(LOCALE, opts)
const timeFmt = fmt({ hour: 'numeric', minute: '2-digit' })
const shortDateFmt = fmt({ month: 'short', day: 'numeric' })
const longDateFmt = fmt({ weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
const monthYearFmt = fmt({ month: 'long', year: 'numeric' })
const weekdayFmt = fmt({ weekday: 'long' })
const weekdayShortFmt = fmt({ weekday: 'short' })
const hourFmt = fmt({ hour: 'numeric' })

export const formatTime = (d) => timeFmt.format(d)
export const formatShortDate = (d) => shortDateFmt.format(d)
export const formatLongDate = (d) => longDateFmt.format(d)
export const formatMonthYear = (d) => monthYearFmt.format(d)
export const formatWeekday = (d) => weekdayFmt.format(d)
export const formatWeekdayShort = (d) => weekdayShortFmt.format(d)
export const formatHour = (d) => hourFmt.format(d)

// French Intl output is lowercase ("mardi", "octobre 2026"); headings need a capital.
export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export function formatDuration(ms) {
  const mins = Math.round(ms / 60_000)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h < 48) return m ? `${h} h ${m} min` : `${h} h`
  return `${Math.round(h / 24)} jours`
}

const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' })

export function formatRelative(target, now) {
  const diff = target - now
  const abs = Math.abs(diff)
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), 'minute')
  if (abs < DAY_MS) return rtf.format(Math.round(diff / 3_600_000), 'hour')
  return rtf.format(Math.round((startOfDay(target) - startOfDay(now)) / DAY_MS), 'day')
}
