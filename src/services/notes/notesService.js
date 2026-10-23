import { supabase } from '../supabase/client.js'

const NOTE_SELECT = '*, note_tags(tag_id, tags(id, name))'

function normalizeNote(row) {
  const { note_tags: noteTags, ...note } = row
  return {
    ...note,
    tags: (noteTags || []).map((entry) => entry.tags).filter(Boolean)
  }
}

function uniqueNames(names) {
  const seen = new Set()
  const result = []
  for (const raw of names) {
    const name = raw.trim()
    const key = name.toLowerCase()
    if (name && !seen.has(key)) {
      seen.add(key)
      result.push(name)
    }
  }
  return result
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
  const names = uniqueNames(rawNames)

  let targetIds = []
  if (names.length > 0) {
    const { error: upsertError } = await supabase
      .from('tags')
      .upsert(
        names.map((name) => ({ name })),
        { onConflict: 'user_id,name', ignoreDuplicates: true }
      )
    if (upsertError) throw upsertError

    const { data: tagRows, error: tagError } = await supabase.from('tags').select('id, name').in('name', names)
    if (tagError) throw tagError
    targetIds = tagRows.map((tag) => tag.id)
  }

  const { data: currentRows, error: currentError } = await supabase
    .from('note_tags')
    .select('tag_id')
    .eq('note_id', noteId)
  if (currentError) throw currentError

  const currentIds = currentRows.map((row) => row.tag_id)
  const toRemove = currentIds.filter((id) => !targetIds.includes(id))
  const toAdd = targetIds.filter((id) => !currentIds.includes(id))

  if (toRemove.length > 0) {
    const { error } = await supabase.from('note_tags').delete().eq('note_id', noteId).in('tag_id', toRemove)
    if (error) throw error
  }

  if (toAdd.length > 0) {
    const { error } = await supabase.from('note_tags').insert(toAdd.map((tagId) => ({ note_id: noteId, tag_id: tagId })))
    if (error) throw error
  }

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
