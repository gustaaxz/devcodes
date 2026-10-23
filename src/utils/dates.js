const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function getWeekdays(weekStart = 0) {
  return [...WEEKDAY_NAMES.slice(weekStart), ...WEEKDAY_NAMES.slice(0, weekStart)]
}

function pad(value) {
  return String(value).padStart(2, '0')
}

export function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromDateKey(key) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toTimeInput(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function toDateTimeInput(date) {
  return `${toDateKey(date)}T${toTimeInput(date)}`
}

export function combineDateTime(dateKey, time) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const [hours, minutes] = (time || '00:00').split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

export function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

export function buildMonthGrid(monthDate, weekStart = 0) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const startDay = 1 - ((first.getDay() - weekStart + 7) % 7)
  return Array.from({ length: 42 }, (_, index) => new Date(first.getFullYear(), first.getMonth(), startDay + index))
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function isAllDayEvent(event) {
  const start = new Date(event.start_at)
  return start.getHours() === 0 && start.getMinutes() === 0 && !event.end_at
}

export function formatMonthYear(date) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
}

export function formatLongDate(date) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

export function formatShortDate(date) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date)
}

export function formatDateTime(date) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

export function formatTime(date) {
  return new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(date)
}
