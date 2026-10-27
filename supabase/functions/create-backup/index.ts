import { createAdminClient, corsHeaders, getAuthenticatedUserId, jsonResponse } from '../_shared/googleCalendar.ts'

const BUCKET = 'user-backups'

async function gzip(input: string) {
  const stream = new Blob([input]).stream().pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function checksum(bytes: Uint8Array) {
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(hash)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

async function createUserBackup(admin: ReturnType<typeof createAdminClient>, userId: string, retentionDays: number) {
  const tables = [
    'categories', 'programming_categories', 'tags', 'notes', 'note_versions', 'tasks', 'task_reminders',
    'reminder_preferences', 'events', 'calendar_sync_logs', 'event_google_mapping', 'stored_files'
  ]
  const entries = await Promise.all(tables.map(async (table) => {
    const { data, error } = await admin.from(table).select('*').eq('user_id', userId)
    if (error) throw error
    return [table, data || []] as const
  }))
  const [profileResult, notesResult, tasksResult, filesResult] = await Promise.all([
    admin.from('profiles').select('*').eq('id', userId).maybeSingle(),
    admin.from('notes').select('id').eq('user_id', userId),
    admin.from('tasks').select('id').eq('user_id', userId),
    admin.from('stored_files').select('id').eq('user_id', userId)
  ])
  for (const result of [profileResult, notesResult, tasksResult, filesResult]) if (result.error) throw result.error
  const links = await Promise.all([
    admin.from('note_tags').select('*').in('note_id', (notesResult.data || []).map((row) => row.id)),
    admin.from('task_tags').select('*').in('task_id', (tasksResult.data || []).map((row) => row.id)),
    admin.from('file_tags').select('*').in('file_id', (filesResult.data || []).map((row) => row.id))
  ])
  for (const result of links) if (result.error) throw result.error
  entries.push(
    ['profiles', profileResult.data ? [profileResult.data] : []] as const,
    ['note_tags', links[0].data || []] as const,
    ['task_tags', links[1].data || []] as const,
    ['file_tags', links[2].data || []] as const
  )
  const payload = JSON.stringify({ format: 'devcodes-backup', version: 2, exported_at: new Date().toISOString(), data: Object.fromEntries(entries) })
  const compressed = await gzip(payload)
  const id = crypto.randomUUID()
  const fileName = `devcodes-backup-${new Date().toISOString().slice(0, 10)}.json.gz`
  const storageKey = `${userId}/${id}.json.gz`
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(storageKey, compressed, { contentType: 'application/gzip', upsert: false })
  if (uploadError) throw uploadError
  const { error: insertError } = await admin.from('backups').insert({
    id, user_id: userId, storage_key: storageKey, file_name: fileName,
    size_bytes: compressed.byteLength, checksum: await checksum(compressed), status: 'ready'
  })
  if (insertError) {
    await admin.storage.from(BUCKET).remove([storageKey])
    throw insertError
  }
  const cutoff = new Date(Date.now() - retentionDays * 86400000).toISOString()
  const { data: expired, error: expiredError } = await admin.from('backups').select('id, storage_key').eq('user_id', userId).lt('created_at', cutoff)
  if (expiredError) throw expiredError
  if (expired?.length) {
    await admin.storage.from(BUCKET).remove(expired.map((backup) => backup.storage_key))
    const { error } = await admin.from('backups').delete().eq('user_id', userId).in('id', expired.map((backup) => backup.id))
    if (error) throw error
  }
  return { id, file_name: fileName, size_bytes: compressed.byteLength, checksum: await checksum(compressed) }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() })
  if (request.method !== 'POST') return jsonResponse({ error: 'Método não permitido.' }, 405)
  const admin = createAdminClient()
  const cronSecret = Deno.env.get('BACKUP_CRON_SECRET')
  const isCron = Boolean(cronSecret && request.headers.get('x-backup-cron-secret') === cronSecret)
  let userIds: string[]
  if (isCron) {
    const { data, error } = await admin.from('backup_preferences').select('user_id, retention_days').eq('automatic_enabled', true)
    if (error) return jsonResponse({ error: 'Não foi possível carregar as preferências de backup.' }, 500)
    userIds = (data || []).map((entry) => entry.user_id)
  } else {
    try { userIds = [await getAuthenticatedUserId(request)] }
    catch { return jsonResponse({ error: 'Sessão inválida.' }, 401) }
  }
  const results = []
  for (const userId of userIds) {
    const { data: preference } = await admin.from('backup_preferences').select('retention_days').eq('user_id', userId).maybeSingle()
    const { data: history } = await admin.from('sync_history').insert({ user_id: userId, sync_type: 'backup', status: 'running' }).select('id').single()
    try {
      const backup = await createUserBackup(admin, userId, preference?.retention_days || 30)
      await admin.from('sync_history').update({ status: 'success', details: backup, completed_at: new Date().toISOString() }).eq('id', history.id)
      results.push({ user_id: userId, ...backup })
    } catch (error) {
      await admin.from('sync_history').update({ status: 'error', details: { message: error instanceof Error ? error.message : 'Falha desconhecida.' }, completed_at: new Date().toISOString() }).eq('id', history.id)
      if (!isCron) return jsonResponse({ error: 'Não foi possível criar o backup.' }, 500)
    }
  }
  return jsonResponse({ backups: results })
})
