import { supabase } from '../supabase/client.js'

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, preferences')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function saveProfile(userId, values) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...values }, { onConflict: 'id' })
    .select('display_name, preferences')
    .single()
  if (error) throw error
  return data
}
