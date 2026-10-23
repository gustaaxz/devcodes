import { supabase } from '../supabase/client.js'

export async function listCategories() {
  const { data, error } = await supabase.from('categories').select('id, name, color').order('name')
  if (error) throw error
  return data
}
