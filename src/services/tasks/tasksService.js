import { supabase } from '../supabase/client.js'
import { setResourceTags } from '../tags/tagService.js'

const TASK_SELECT = '*, categories(id, name, color), task_tags(tag_id, tags(id, name, color, is_favorite))'

function normalizeTask(row) {
  const { task_tags: taskTags, ...task } = row
  return { ...task, tags: (taskTags || []).map((entry) => entry.tags).filter(Boolean) }
}

export async function listTasks() {
  const { data, error } = await supabase.from('tasks').select(TASK_SELECT).order('created_at', { ascending: false })
  if (error) throw error
  return data.map(normalizeTask)
}

export async function listTasksDueInRange(start, end) {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .gte('due_at', start.toISOString())
    .lt('due_at', end.toISOString())
    .order('due_at')
  if (error) throw error
  return data.map(normalizeTask)
}

export async function createTask(values) {
  const { data, error } = await supabase.from('tasks').insert(values).select(TASK_SELECT).single()
  if (error) throw error
  return normalizeTask(data)
}

export async function updateTask(id, values) {
  const { data, error } = await supabase.from('tasks').update(values).eq('id', id).select(TASK_SELECT).single()
  if (error) throw error
  return normalizeTask(data)
}

export async function setTaskTags(taskId, names) {
  await setResourceTags('task', taskId, names)
  const { data, error } = await supabase.from('tasks').select(TASK_SELECT).eq('id', taskId).single()
  if (error) throw error
  return normalizeTask(data)
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
