import { supabase } from '../supabase/client.js'
import { parseImportData } from '../import/importData.js'
import { mapBackupSnapshotForImport } from './backupUtils.js'

const BACKUP_BUCKET = 'user-backups'

async function getUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user?.id) throw new Error('Entre na sua conta para gerenciar backups.')
  return data.user.id
}

export async function listBackups() {
  const userId = await getUserId()
  const [backups, preferences, history, calendarHistory, changes] = await Promise.all([
    supabase.from('backups').select('id, file_name, size_bytes, checksum, status, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
    supabase.from('backup_preferences').select('automatic_enabled, retention_days').eq('user_id', userId).maybeSingle(),
    supabase.from('sync_history').select('id, sync_type, status, details, started_at, completed_at').eq('user_id', userId).order('started_at', { ascending: false }).limit(10),
    supabase.from('calendar_sync_logs').select('id, direction, status, message, imported_count, exported_count, conflict_count, started_at, completed_at').eq('user_id', userId).order('started_at', { ascending: false }).limit(10),
    supabase.from('change_log').select('id, entity_type, record_id, operation, old_values, new_values, occurred_at').eq('user_id', userId).order('occurred_at', { ascending: false }).limit(50)
  ])
  for (const result of [backups, preferences, history, calendarHistory, changes]) if (result.error) throw result.error
  const combinedHistory = [
    ...history.data,
    ...calendarHistory.data.map((entry) => ({
      id: `google-${entry.id}`,
      sync_type: 'google_calendar',
      status: entry.status,
      details: { direction: entry.direction, message: entry.message, imported_count: entry.imported_count, exported_count: entry.exported_count, conflict_count: entry.conflict_count },
      started_at: entry.started_at,
      completed_at: entry.completed_at
    }))
  ].sort((a, b) => new Date(b.started_at) - new Date(a.started_at)).slice(0, 10)
  return { backups: backups.data, preferences: preferences.data || { automatic_enabled: false, retention_days: 30 }, history: combinedHistory, changes: changes.data }
}

export async function saveBackupPreferences(values) {
  const userId = await getUserId()
  const { data, error } = await supabase.from('backup_preferences').upsert({ user_id: userId, ...values }).select('automatic_enabled, retention_days').single()
  if (error) throw error
  return data
}

export async function createBackup() {
  const { data, error } = await supabase.functions.invoke('create-backup', { body: {} })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data?.backups?.[0]
}

export async function downloadBackup(backupId) {
  const userId = await getUserId()
  const { data: backup, error: findError } = await supabase.from('backups').select('storage_key, file_name').eq('id', backupId).eq('user_id', userId).single()
  if (findError) throw findError
  const { data, error } = await supabase.storage.from(BACKUP_BUCKET).createSignedUrl(backup.storage_key, 60, { download: backup.file_name })
  if (error) throw error
  window.location.assign(data.signedUrl)
}

export async function prepareBackupRestore(backupId) {
  const userId = await getUserId()
  const { data: backup, error: findError } = await supabase.from('backups').select('storage_key').eq('id', backupId).eq('user_id', userId).single()
  if (findError) throw findError
  const { data: compressed, error } = await supabase.storage.from(BACKUP_BUCKET).download(backup.storage_key)
  if (error) throw error
  let text
  try {
    const stream = compressed.stream().pipeThrough(new DecompressionStream('gzip'))
    text = await new Response(stream).text()
  } catch {
    throw new Error('Não foi possível descompactar o backup. O arquivo pode estar corrompido.')
  }
  let snapshot
  try { snapshot = JSON.parse(text) }
  catch { throw new Error('O conteúdo do backup não é um JSON válido.') }
  const importFile = JSON.stringify(mapBackupSnapshotForImport(snapshot))
  return parseImportData(importFile, 'backup.json')
}
