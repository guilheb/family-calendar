import { LOCALE } from './date'

// Describes an iCalendar RRULE (an ICAL.Recur) in French, e.g.
// "Toutes les semaines, le mardi et le jeudi, jusqu'au 19 décembre 2026".
// `start` is the series' first occurrence; it fills in the day or month the rule leaves implicit.

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

const weekdayFmt = new Intl.DateTimeFormat(LOCALE, { weekday: 'long' })
const monthFmt = new Intl.DateTimeFormat(LOCALE, { month: 'long' })
const monthYearFmt = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' })

// 2000-01-02 was a Sunday.
const weekdayName = (code) => weekdayFmt.format(new Date(2000, 0, 2 + WEEKDAYS.indexOf(code)))
const monthName = (m) => monthFmt.format(new Date(2000, m - 1, 1))

function ordinal(n) {
  if (n === -1) return 'dernier'
  if (n === -2) return 'avant-dernier'
  return n === 1 ? '1er' : `${n}e`
}

// ['a', 'b', 'c'] → "a, b et c"
function joinList(items) {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`
}

// "-1SU" → { pos: -1, day: 'SU' }; "TU" → { pos: null, day: 'TU' }
function parseByDay(value) {
  const m = /^([+-]?\d+)?([A-Z]{2})$/.exec(value)
  return m && { pos: m[1] ? Number(m[1]) : null, day: m[2] }
}

const dayNumber = (d) => (d === 1 ? '1er' : String(d))

// "1er janvier 2024" (Intl writes "1 janvier")
const formatDate = (d) => `${dayNumber(d.getDate())} ${monthYearFmt.format(d)}`

// Monday first, as in the rest of the calendar.
const weekOrder = (day) => (WEEKDAYS.indexOf(day) + 6) % 7

// "le 3e mardi", "le dernier dimanche", "le lundi et le jeudi"
function describeDays(byDay, bySetPos) {
  const days = byDay.map(parseByDay).filter(Boolean).sort((a, b) => weekOrder(a.day) - weekOrder(b.day))
  const setPos = bySetPos?.length === 1 ? bySetPos[0] : null
  return joinList(days.map(({ pos, day }) => {
    const p = pos ?? setPos
    return p ? `le ${ordinal(p)} ${weekdayName(day)}` : `le ${weekdayName(day)}`
  }))
}

// "le 25", "les 21, 22, 23 et 24"
function describeMonthDays(byMonthDay) {
  const days = byMonthDay.map(dayNumber)
  return `${days.length > 1 ? 'les' : 'le'} ${joinList(days)}`
}

// FREQ → [prefix, unit]: "Tous les jours", "Toutes les 2 semaines"
const FREQUENCIES = {
  DAILY: ['Tous les', 'jours'],
  WEEKLY: ['Toutes les', 'semaines'],
  MONTHLY: ['Tous les', 'mois'],
  YEARLY: ['Tous les', 'ans'],
}

function describeFrequency(freq, interval) {
  const [prefix, unit] = FREQUENCIES[freq] ?? []
  if (!prefix) return null
  return interval === 1 ? `${prefix} ${unit}` : `${prefix} ${interval} ${unit}`
}

function describeWhen(recur, start) {
  const { BYDAY: byDay, BYMONTHDAY: byMonthDay, BYMONTH: byMonth, BYSETPOS: bySetPos } = recur.parts
  switch (recur.freq) {
    case 'WEEKLY': {
      const days = byDay ?? [WEEKDAYS[start.getDay()]]
      if (days.length === 5 && ['MO', 'TU', 'WE', 'TH', 'FR'].every((d) => days.includes(d))) {
        return 'du lundi au vendredi'
      }
      return describeDays(days)
    }
    case 'MONTHLY':
      if (byDay) return describeDays(byDay, bySetPos)
      return describeMonthDays(byMonthDay ?? [start.getDate()])
    case 'YEARLY': {
      const months = joinList((byMonth ?? [start.getMonth() + 1]).map(monthName))
      if (byDay) return `${describeDays(byDay, bySetPos)} ${/^[aeiou]/.test(months) ? "d'" : 'de '}${months}`
      return `${describeMonthDays(byMonthDay ?? [start.getDate()])} ${months}`
    }
    default:
      return null
  }
}

export function describeRecurrence(recur, start) {
  const frequency = describeFrequency(recur.freq, recur.interval ?? 1)
  if (!frequency) return null

  const parts = [frequency, describeWhen(recur, start)]
  if (recur.count) parts.push(`${recur.count} fois`)
  else if (recur.until) parts.push(`jusqu'au ${formatDate(recur.until.toJSDate())}`)
  return parts.filter(Boolean).join(', ')
}
