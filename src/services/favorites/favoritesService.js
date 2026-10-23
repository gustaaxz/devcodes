import { supabase } from '../supabase/client.js'
import { FILE_WITH_CATEGORY } from '../files/filesService.js'

async function run(query) {
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function loadFavorites() {
  const [notes, files] = await Promise.all([
    run(
      supabase
        .from('notes')
        .select('id, title, content, linked_date, updated_at')
        .eq('is_favorite', true)
        .order('updated_at', { ascending: false })
    ),
    run(
      supabase
        .from('stored_files')
        .select(FILE_WITH_CATEGORY)
        .eq('is_favorite', true)
        .order('updated_at', { ascending: false })
    )
  ])
  return { notes, files }
}
