import { supabase } from '../supabase/client.js'

const EVENT_SELECT = '*, categories(id, name, color)'

export async function listEventsInRange(start, end) {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .gte('start_at', start.toISOString())
    .lt('start_at', end.toISOString())
    .order('start_at')
  if (error) throw error
  return data
}

export async function createEvent(values) {
  const { data, error } = await supabase.from('events').insert(values).select(EVENT_SELECT).single()
  if (error) throw error
  return data
}

export async function updateEvent(id, values) {
  const { data, error } = await supabase.from('events').update(values).eq('id', id).select(EVENT_SELECT).single()
  if (error) throw error
  return data
}

export async function deleteEvent(id) {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}
