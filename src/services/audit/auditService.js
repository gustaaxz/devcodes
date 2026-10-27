import { supabase } from '../supabase/client.js'

export async function listAuditEntries(userId, limit = 50) {
  if (!userId) throw new Error('userId é obrigatório.')
  const { data, error } = await supabase
    .from('audit_log')
    .select('id, entity_type, record_id, operation, changed_fields, occurred_at')
    .eq('user_id', userId)
    .order('occurred_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}
