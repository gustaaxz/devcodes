import { supabase } from '../supabase/client.js'

const VERSION_SELECT = 'id, note_id, title, content, created_at'

export async function listNoteVersions(noteId) {
  const { data, error } = await supabase
    .from('note_versions')
    .select(VERSION_SELECT)
    .eq('note_id', noteId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getNoteVersion(versionId) {
  const { data, error } = await supabase
    .from('note_versions')
    .select(VERSION_SELECT)
    .eq('id', versionId)
    .single()
  if (error) throw error
  return data
}

export async function restoreNoteVersion(noteId, versionId) {
  const version = await getNoteVersion(versionId)
  
  const { data, error } = await supabase
    .from('notes')
    .update({
      title: version.title,
      content: version.content
    })
    .eq('id', noteId)
    .select('*, note_tags(tag_id, tags(id, name))')
    .single()
  
  if (error) throw error
  
  const { note_tags: noteTags, ...note } = data
  return {
    ...note,
    tags: (noteTags || []).map((entry) => entry.tags).filter(Boolean)
  }
}

export async function deleteOldVersions(noteId, keepCount = 20) {
  const { data: versions } = await supabase
    .from('note_versions')
    .select('id')
    .eq('note_id', noteId)
    .order('created_at', { ascending: false })
    .range(keepCount, 1000)
  
  if (!versions || versions.length === 0) return
  
  const { error } = await supabase
    .from('note_versions')
    .delete()
    .in('id', versions.map((v) => v.id))
  
  if (error) throw error
}
