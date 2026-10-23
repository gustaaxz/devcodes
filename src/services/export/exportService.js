import { supabase } from '../supabase/client.js'

export async function exportNotesAsJSON() {
  const { data, error } = await supabase
    .from('notes')
    .select('*, note_tags(tags(name))')
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map((note) => ({
    ...note,
    tags: note.note_tags?.map((nt) => nt.tags?.name).filter(Boolean) || []
  }))
}

export async function exportTasksAsJSON() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, categories(name)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function exportEventsAsJSON() {
  const { data, error } = await supabase
    .from('events')
    .select('*, categories(name)')
    .order('start_at', { ascending: false })

  if (error) throw error
  return data
}

function convertToCSV(data, fields) {
  if (!data.length) return ''

  const headers = fields.join(',')
  const rows = data.map((item) =>
    fields
      .map((field) => {
        const value = field.includes('.') ? field.split('.').reduce((obj, key) => obj?.[key], item) : item[field]
        const strValue = String(value || '')
        return strValue.includes(',') ? `"${strValue.replace(/"/g, '""')}"` : strValue
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
  const csv = convertToCSV(notes, ['title', 'content', 'created_at', 'updated_at'])
  downloadFile(csv, `notes-${Date.now()}.csv`, 'text/csv')
}

export async function exportNotesAsJSON_Download() {
  const notes = await exportNotesAsJSON()
  const json = JSON.stringify(notes, null, 2)
  downloadFile(json, `notes-${Date.now()}.json`, 'application/json')
}

export async function exportTasksAsCSV() {
  const tasks = await exportTasksAsJSON()
  const csv = convertToCSV(tasks, ['title', 'status', 'priority', 'due_at', 'created_at'])
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
