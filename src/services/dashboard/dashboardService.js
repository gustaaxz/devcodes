import { supabase } from '../supabase/client.js'
import { FILE_WITH_CATEGORY } from '../files/filesService.js'

const EVENT_SELECT = '*, categories(id, name, color)'
const TASK_SELECT = '*, categories(id, name, color)'

async function run(query) {
  const { data, error } = await query
  if (error) throw error
  return data
}

async function count(query) {
  const { count: total, error } = await query
  if (error) throw error
  return total || 0
}

export async function loadDashboard() {
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const horizon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 31)

  const [pending, overdue, notesTotal, todayEvents, upcomingEvents, upcomingTasks, recentNotes, recentFiles] =
    await Promise.all([
      count(supabase.from('tasks').select('id', { count: 'exact', head: true }).neq('status', 'done')),
      count(
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .neq('status', 'done')
          .lt('due_at', now.toISOString())
      ),
      count(supabase.from('notes').select('id', { count: 'exact', head: true })),
      run(
        supabase
          .from('events')
          .select(EVENT_SELECT)
          .gte('start_at', startToday.toISOString())
          .lt('start_at', startTomorrow.toISOString())
          .neq('status', 'cancelled')
          .order('start_at')
      ),
      run(
        supabase
          .from('events')
          .select(EVENT_SELECT)
          .gte('start_at', startTomorrow.toISOString())
          .lt('start_at', horizon.toISOString())
          .eq('status', 'scheduled')
          .order('start_at')
          .limit(6)
      ),
      run(
        supabase
          .from('tasks')
          .select(TASK_SELECT)
          .neq('status', 'done')
          .not('due_at', 'is', null)
          .order('due_at')
          .limit(6)
      ),
      run(
        supabase
          .from('notes')
          .select('id, title, content, linked_date, updated_at')
          .order('updated_at', { ascending: false })
          .limit(5)
      ),
      run(supabase.from('stored_files').select(FILE_WITH_CATEGORY).order('created_at', { ascending: false }).limit(5))
    ])

  return { pending, overdue, notesTotal, todayEvents, upcomingEvents, upcomingTasks, recentNotes, recentFiles }
}
