import { supabase } from '../supabase/client.js'

export const REMINDER_OFFSET_OPTIONS = [
  { value: 5, label: '5 minutos antes' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 120, label: '2 horas antes' },
  { value: 1440, label: '1 dia antes' },
  { value: 2880, label: '2 dias antes' },
]

export const REMINDER_CHANNEL_OPTIONS = [
  { value: 'in_app', label: 'Apenas no aplicativo' },
  { value: 'email', label: 'E-mail' },
  { value: 'both', label: 'Aplicativo e E-mail' },
]

/**
 * Calculates remind_at date given due_at and offset in minutes.
 */
export function calculateRemindAt(dueAt, offsetMinutes) {
  if (!dueAt) return null
  const due = new Date(dueAt).getTime()
  if (!Number.isFinite(due) || !Number.isFinite(Number(offsetMinutes)) || Number(offsetMinutes) < 0) {
    throw new Error('Data ou antecedência do lembrete inválida.')
  }
  const offsetMs = offsetMinutes * 60 * 1000
  return new Date(due - offsetMs).toISOString()
}

/**
 * Returns human-readable label for an offset in minutes.
 */
export function getOffsetLabel(offsetMinutes) {
  const match = REMINDER_OFFSET_OPTIONS.find((opt) => opt.value === Number(offsetMinutes))
  if (match) return match.label
  if (offsetMinutes >= 1440) return `${Math.round(offsetMinutes / 1440)}d antes`
  if (offsetMinutes >= 60) return `${Math.round(offsetMinutes / 60)}h antes`
  return `${offsetMinutes}m antes`
}

/**
 * List all reminders for a user (includes joined task details).
 */
export async function listUserReminders(userId) {
  if (!userId) throw new Error('userId é obrigatório.')
  const { data, error } = await supabase
    .from('task_reminders')
    .select('*, tasks (id, title, due_at, status, priority)')
    .eq('user_id', userId)
    .neq('tasks.status', 'done')
    .in('status', ['pending', 'notified', 'snoozed'])
    .order('remind_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Get active reminder for a specific task.
 */
export async function getReminderForTask(taskId, userId) {
  if (!taskId || !userId) throw new Error('taskId e userId são obrigatórios.')
  const { data, error } = await supabase
    .from('task_reminders')
    .select('*')
    .eq('task_id', taskId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Create or replace a reminder for a task.
 */
export async function setTaskReminder({ taskId, userId, dueAt, offsetMinutes, channel = 'in_app' }) {
  if (!taskId || !userId) throw new Error('taskId e userId são obrigatórios.')
  const remindAt = calculateRemindAt(dueAt, offsetMinutes)
  if (!remindAt) throw new Error('Data limite necessária para calcular o lembrete.')
  if (!['in_app', 'both'].includes(channel)) {
    throw new Error('Canal de lembrete inválido.')
  }

  // Check if reminder already exists for this task
  const existing = await getReminderForTask(taskId, userId)

  if (existing) {
    const { data, error } = await supabase
      .from('task_reminders')
      .update({
        remind_at: remindAt,
        offset_minutes: offsetMinutes,
        channel,
        status: 'pending'
      })
      .eq('id', existing.id)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('task_reminders')
    .insert({
      task_id: taskId,
      user_id: userId,
      remind_at: remindAt,
      offset_minutes: offsetMinutes,
      channel,
      status: 'pending'
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a reminder by task ID.
 */
export async function removeTaskReminder(taskId, userId) {
  if (!taskId || !userId) throw new Error('taskId e userId são obrigatórios.')
  const { error } = await supabase.from('task_reminders').delete().eq('task_id', taskId).eq('user_id', userId)
  if (error) throw error
}

/**
 * Return due in-app reminders that have not been delivered yet.
 */
export async function listDueReminders(userId, now = new Date().toISOString()) {
  if (!userId) throw new Error('userId é obrigatório.')
  const { data, error } = await supabase
    .from('task_reminders')
    .select('*, tasks (id, title, due_at, status, priority)')
    .eq('user_id', userId)
    .in('status', ['pending', 'snoozed'])
    .in('channel', ['in_app', 'both'])
    .lte('remind_at', now)
    .neq('tasks.status', 'done')
    .order('remind_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function markReminderNotified(reminderId, userId, expectedRemindAt) {
  const { data, error } = await supabase
    .from('task_reminders')
    .update({ status: 'notified' })
    .eq('id', reminderId)
    .eq('user_id', userId)
    .eq('remind_at', expectedRemindAt)
    .in('status', ['pending', 'snoozed'])
    .select('*')
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Snooze a reminder by N minutes from right now.
 */
export async function snoozeReminder(reminderId, minutes = 15, userId) {
  if (!reminderId || !userId) throw new Error('reminderId e userId são obrigatórios.')
  const newRemindAt = new Date(Date.now() + minutes * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('task_reminders')
    .update({
      remind_at: newRemindAt,
      status: 'snoozed'
    })
    .eq('id', reminderId)
    .eq('user_id', userId)
    .in('status', ['notified', 'pending', 'snoozed'])
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * Dismiss a reminder.
 */
export async function dismissReminder(reminderId, userId) {
  if (!reminderId || !userId) throw new Error('reminderId e userId são obrigatórios.')
  const { data, error } = await supabase
    .from('task_reminders')
    .update({ status: 'dismissed' })
    .eq('id', reminderId)
    .eq('user_id', userId)
    .in('status', ['notified', 'pending', 'snoozed'])
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * Load reminder preferences for a user.
 */
export async function getReminderPreferences(userId) {
  if (!userId) throw new Error('userId é obrigatório.')
  const { data, error } = await supabase
    .from('reminder_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    return {
      in_app_enabled: true,
      email_enabled: false,
      default_offset_minutes: 15
    }
  }
  return data
}

/**
 * Save reminder preferences for a user.
 */
export async function saveReminderPreferences(userId, prefs) {
  if (!userId) throw new Error('userId é obrigatório.')
  const { data, error } = await supabase
    .from('reminder_preferences')
    .upsert({
      user_id: userId,
      in_app_enabled: prefs.in_app_enabled,
      email_enabled: false,
      default_offset_minutes: prefs.default_offset_minutes,
      updated_at: new Date().toISOString()
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}
