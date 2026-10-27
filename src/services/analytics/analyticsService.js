import { supabase } from '../supabase/client.js'
import { getActiveLocale } from '../../utils/localeStore.js'
import { translate } from '../../utils/i18n.js'

function dayKey(value) {
  return new Date(value).toISOString().slice(0, 10)
}

export function buildAnalytics({ tasks = [], notes = [], files = [], categories = [], days = 30, now = new Date(), locale = getActiveLocale() }) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  const points = Array.from({ length: days }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return { date: dayKey(date), label: new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit' }).format(date), tasks: 0, notes: 0, files: 0 }
  })
  const byDay = new Map(points.map((point) => [point.date, point]))
  for (const task of tasks) {
    if (task.status === 'done' && task.completed_at) {
      const point = byDay.get(dayKey(task.completed_at))
      if (point) point.tasks += 1
    }
  }
  for (const note of notes) {
    const point = byDay.get(dayKey(note.created_at))
    if (point) point.notes += 1
  }
  for (const file of files) {
    const point = byDay.get(dayKey(file.created_at))
    if (point) point.files += 1
  }

  const completedTasks = tasks.filter((task) => task.status === 'done').length
  const pendingTasks = tasks.filter((task) => task.status !== 'done').length
  const categoryCounts = new Map()
  for (const task of tasks) {
    if (task.status === 'done' && task.category_id) categoryCounts.set(task.category_id, (categoryCounts.get(task.category_id) || 0) + 1)
  }
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  const categoriesData = [...categoryCounts].map(([id, value]) => ({ name: categoryById.get(id)?.name || translate(locale, 'Sem categoria'), color: categoryById.get(id)?.color || 'var(--color-accent)', value }))
    .sort((a, b) => b.value - a.value)
  const totalTasks = tasks.length
  const activeDays = points.filter((point) => point.tasks + point.notes + point.files > 0).length
  const bestDay = [...points].sort((a, b) => (b.tasks + b.notes + b.files) - (a.tasks + a.notes + a.files))[0]
  const activityTotal = (point) => point.tasks + point.notes + point.files
  let streakIndex = points.length - 1
  if (streakIndex > 0 && activityTotal(points[streakIndex]) === 0) streakIndex -= 1
  let currentStreak = 0
  for (let index = streakIndex; index >= 0 && activityTotal(points[index]) > 0; index -= 1) currentStreak += 1
  let bestStreak = 0
  let runningStreak = 0
  for (const point of points) {
    runningStreak = activityTotal(point) > 0 ? runningStreak + 1 : 0
    bestStreak = Math.max(bestStreak, runningStreak)
  }
  const weekdayTotals = new Map()
  for (const point of points) {
    const weekday = new Date(`${point.date}T12:00:00`).getDay()
    weekdayTotals.set(weekday, (weekdayTotals.get(weekday) || 0) + activityTotal(point))
  }
  const bestWeekdayIndex = [...weekdayTotals].sort((a, b) => b[1] - a[1])[0]
  const mostActiveWeekday = bestWeekdayIndex?.[1]
    ? new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(new Date(2023, 0, 1 + bestWeekdayIndex[0]))
    : null
  const currentWeekActivity = points.slice(-7).reduce((sum, point) => sum + activityTotal(point), 0)
  const previousWeekActivity = points.slice(-14, -7).reduce((sum, point) => sum + activityTotal(point), 0)
  const weeklyChangePercent = previousWeekActivity
    ? Math.round(((currentWeekActivity - previousWeekActivity) / previousWeekActivity) * 100)
    : currentWeekActivity ? 100 : 0

  return {
    days,
    points,
    completedTasks,
    pendingTasks,
    completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
    notesCreated: notes.length,
    filesAdded: files.length,
    activeDays,
    currentStreak,
    bestStreak,
    mostActiveWeekday,
    weeklyChangePercent,
    bestDay: bestDay && bestDay.tasks + bestDay.notes + bestDay.files > 0 ? bestDay : null,
    categories: categoriesData
  }
}

export async function loadAnalytics(days = 30, locale = getActiveLocale()) {
  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  const userId = auth.user?.id
  if (!userId) throw new Error('Entre na sua conta para ver as métricas.')
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  const startIso = start.toISOString()
  const [tasks, notes, files, categories] = await Promise.all([
    supabase.from('tasks').select('status, completed_at, category_id').eq('user_id', userId),
    supabase.from('notes').select('created_at').eq('user_id', userId).gte('created_at', startIso),
    supabase.from('stored_files').select('created_at').eq('user_id', userId).gte('created_at', startIso),
    supabase.from('categories').select('id, name, color').eq('user_id', userId)
  ])
  for (const result of [tasks, notes, files, categories]) if (result.error) throw result.error
  const rangeStart = startIso
  const recentTasks = tasks.data.filter((task) => !task.completed_at || task.completed_at >= rangeStart)
  return buildAnalytics({ tasks: recentTasks, notes: notes.data, files: files.data, categories: categories.data, days, locale })
}
