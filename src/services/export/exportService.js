import { supabase } from '../supabase/client.js'
import { BACKUP_FORMAT, BACKUP_VERSION } from '../import/importData.js'

async function getExportUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user?.id) throw new Error('Entre na sua conta para exportar dados.')
  return data.user.id
}

export async function exportNotesAsJSON() {
  const userId = await getExportUserId()
  const { data, error } = await supabase
    .from('notes')
    .select('*, categories(name), note_tags(tags(name))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map((note) => serializeNote(note))
}

export async function exportTasksAsJSON() {
  const userId = await getExportUserId()
  const { data, error } = await supabase
    .from('tasks')
    .select('*, categories(name), task_tags(tags(name))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data.map(serializeTask)
}

export async function exportEventsAsJSON() {
  const userId = await getExportUserId()
  const { data, error } = await supabase
    .from('events')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .order('start_at', { ascending: false })

  if (error) throw error
  return data.map(serializeEvent)
}

function serializeNote(note) {
  return {
    title: note.title,
    content: note.content,
    category: note.categories?.name ?? null,
    linked_date: note.linked_date,
    is_favorite: note.is_favorite,
    is_pinned: note.is_pinned,
    created_at: note.created_at,
    updated_at: note.updated_at,
    tags: note.note_tags?.map((entry) => entry.tags?.name).filter(Boolean) ?? []
  }
}

function serializeTask(task) {
  return {
    title: task.title,
    description: task.description,
    category: task.categories?.name ?? null,
    due_at: task.due_at,
    priority: task.priority,
    status: task.status,
    completed_at: task.completed_at,
    created_at: task.created_at,
    updated_at: task.updated_at,
    tags: task.task_tags?.map((entry) => entry.tags?.name).filter(Boolean) ?? []
  }
}

function serializeEvent(event) {
  return {
    title: event.title,
    description: event.description,
    category: event.categories?.name ?? null,
    start_at: event.start_at,
    end_at: event.end_at,
    priority: event.priority,
    status: event.status,
    reminder_at: event.reminder_at,
    ical_uid: event.ical_uid,
    created_at: event.created_at,
    updated_at: event.updated_at
  }
}

function convertToCSV(data, fields) {
  if (!data.length) return ''

  const headers = fields.join(',')
  const rows = data.map((item) =>
    fields
      .map((field) => {
        const value = field.includes('.') ? field.split('.').reduce((obj, key) => obj?.[key], item) : item[field]
        const strValue = value === null || value === undefined ? '' : Array.isArray(value) ? value.join('|') : String(value)
        return /[",\r\n]/.test(strValue) ? `"${strValue.replace(/"/g, '""')}"` : strValue
      })
      .join(',')
  )

  return [headers, ...rows].join('\n')
}

export function downloadFile(content, filename, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function exportNotesAsCSV() {
  const notes = await exportNotesAsJSON()
  const csv = convertToCSV(notes, ['title', 'content', 'tags', 'created_at', 'updated_at'])
  downloadFile(csv, `notes-${Date.now()}.csv`, 'text/csv')
}

export async function exportNotesAsJSON_Download() {
  const notes = await exportNotesAsJSON()
  const json = JSON.stringify(notes, null, 2)
  downloadFile(json, `notes-${Date.now()}.json`, 'application/json')
}

export async function exportTasksAsCSV() {
  const tasks = await exportTasksAsJSON()
  const csv = convertToCSV(tasks, ['title', 'status', 'priority', 'due_at', 'tags', 'created_at'])
  downloadFile(csv, `tasks-${Date.now()}.csv`, 'text/csv')
}

export async function exportTasksAsJSON_Download() {
  const tasks = await exportTasksAsJSON()
  const json = JSON.stringify(tasks, null, 2)
  downloadFile(json, `tasks-${Date.now()}.json`, 'application/json')
}

export async function exportEventsAsCSV() {
  const events = await exportEventsAsJSON()
  const csv = convertToCSV(events, ['title', 'start_at', 'end_at', 'status', 'created_at'])
  downloadFile(csv, `events-${Date.now()}.csv`, 'text/csv')
}

export async function exportEventsAsJSON_Download() {
  const events = await exportEventsAsJSON()
  const json = JSON.stringify(events, null, 2)
  downloadFile(json, `events-${Date.now()}.json`, 'application/json')
}

export async function exportFullBackup() {
  const userId = await getExportUserId()
  const [notes, tasks, events] = await Promise.all([
    supabase.from('notes').select('*, categories(name), note_tags(tags(name))').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('tasks').select('*, categories(name), task_tags(tags(name))').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('events').select('*, categories(name)').eq('user_id', userId).order('start_at', { ascending: false })
  ])

  for (const result of [notes, tasks, events]) {
    if (result.error) throw result.error
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    data: {
      notes: notes.data.map(serializeNote),
      tasks: tasks.data.map(serializeTask),
      events: events.data.map(serializeEvent)
    }
  }
}

export async function exportFullBackupDownload() {
  const backup = await exportFullBackup()
  downloadFile(JSON.stringify(backup, null, 2), `devcodes-backup-${Date.now()}.json`, 'application/json')
}
