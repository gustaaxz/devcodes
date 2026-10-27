import { supabase } from '../supabase/client.js'
import { setResourceTags } from '../tags/tagService.js'

const NOTE_SELECT = '*, note_tags(tag_id, tags(id, name, color, is_favorite))'

function normalizeNote(row) {
  const { note_tags: noteTags, ...note } = row
  return {
    ...note,
    tags: (noteTags || []).map((entry) => entry.tags).filter(Boolean)
  }
}

export async function listNotes() {
  const { data, error } = await supabase.from('notes').select(NOTE_SELECT).order('updated_at', { ascending: false })
  if (error) throw error
  return data.map(normalizeNote)
}

export async function listNotesLinkedBetween(startKey, endKey) {
  const { data, error } = await supabase
    .from('notes')
    .select('id, title, linked_date')
    .gte('linked_date', startKey)
    .lte('linked_date', endKey)
    .order('linked_date')
  if (error) throw error
  return data
}

export async function createNote(values = {}) {
  const { data, error } = await supabase.from('notes').insert(values).select(NOTE_SELECT).single()
  if (error) throw error
  return normalizeNote(data)
}

export async function updateNote(id, values) {
  const { data, error } = await supabase.from('notes').update(values).eq('id', id).select(NOTE_SELECT).single()
  if (error) throw error
  return normalizeNote(data)
}

export async function deleteNote(id) {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}

export async function setNoteTags(noteId, rawNames) {
  await setResourceTags('note', noteId, rawNames)

  const { data, error } = await supabase.from('notes').select(NOTE_SELECT).eq('id', noteId).single()
  if (error) throw error
  return normalizeNote(data)
}

export async function duplicateNote(note) {
  const copy = await createNote({
    title: note.title ? `Cópia de ${note.title}` : '',
    content: note.content,
    category_id: note.category_id,
    linked_date: note.linked_date
  })
  if (note.tags.length === 0) return copy
  return setNoteTags(
    copy.id,
    note.tags.map((tag) => tag.name)
  )
}
