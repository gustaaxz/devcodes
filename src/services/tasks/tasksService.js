import { supabase } from '../supabase/client.js'

const TASK_SELECT = '*, categories(id, name, color)'

export async function listTasks() {
  const { data, error } = await supabase.from('tasks').select(TASK_SELECT).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function listTasksDueInRange(start, end) {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .gte('due_at', start.toISOString())
    .lt('due_at', end.toISOString())
    .order('due_at')
  if (error) throw error
  return data
}

export async function createTask(values) {
  const { data, error } = await supabase.from('tasks').insert(values).select(TASK_SELECT).single()
  if (error) throw error
  return data
}

export async function updateTask(id, values) {
  const { data, error } = await supabase.from('tasks').update(values).eq('id', id).select(TASK_SELECT).single()
  if (error) throw error
  return data
}

export async function setTaskStatus(id, status) {
  return updateTask(id, {
    status,
    completed_at: status === 'done' ? new Date().toISOString() : null
  })
}

export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}
