import { supabase } from '../supabase/client.js'

const LIMIT = 5

export function sanitizeTerm(term) {
  return term.replace(/[,()"\\%_*]/g, ' ').replace(/\s+/g, ' ').trim()
}

async function run(query) {
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function searchAll(rawTerm) {
  const term = sanitizeTerm(rawTerm)
  const pattern = `%${term}%`

  const [notes, tasks, events, files, categories, programmingCategories, tags] = await Promise.all([
    run(
      supabase
        .from('notes')
        .select('id, title, content, linked_date, updated_at')
        .or(`title.ilike.${pattern},content.ilike.${pattern}`)
        .order('updated_at', { ascending: false })
        .limit(LIMIT)
    ),
    run(
      supabase
        .from('tasks')
        .select('id, title, status, due_at')
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .order('created_at', { ascending: false })
        .limit(LIMIT)
    ),
    run(
      supabase
        .from('events')
        .select('id, title, start_at')
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .order('start_at', { ascending: false })
        .limit(LIMIT)
    ),
    run(
      supabase
        .from('stored_files')
        .select('id, original_name, size_bytes, category_id, extension')
        .or(`original_name.ilike.${pattern},description.ilike.${pattern}`)
        .order('updated_at', { ascending: false })
        .limit(LIMIT)
    ),
    run(supabase.from('categories').select('id, name, color').ilike('name', pattern).limit(LIMIT)),
    run(supabase.from('programming_categories').select('id, name, slug').ilike('name', pattern).limit(LIMIT)),
    run(supabase.from('tags').select('id, name').ilike('name', pattern).limit(LIMIT))
  ])

  return {
    notes,
    tasks,
    events,
    files,
    categories: [
      ...categories.map((item) => ({ ...item, kind: 'academic' })),
      ...programmingCategories.map((item) => ({ ...item, kind: 'programming' }))
    ],
    tags
  }
}

export function countResults(results) {
  return Object.values(results).reduce((total, list) => total + list.length, 0)
}
