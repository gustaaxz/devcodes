import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth.js'
import { useDataVersion } from './useDataVersion.js'
import {
  dismissReminder as dismissReminderRecord,
  getReminderPreferences,
  listDueReminders,
  listUserReminders,
  markReminderNotified,
  saveReminderPreferences,
  snoozeReminder as snoozeReminderRecord
} from '../services/reminders/reminderService.js'
import { setTaskStatus } from '../services/tasks/tasksService.js'

const POLL_INTERVAL_MS = 30_000

export function useTaskReminders() {
  const { user } = useAuth()
  const userId = user?.id
  const { bump } = useDataVersion()
  const [reminders, setReminders] = useState([])
  const [toasts, setToasts] = useState([])
  const [preferences, setPreferences] = useState({
    in_app_enabled: true,
    email_enabled: false,
    default_offset_minutes: 15
  })
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!userId) return
    const [nextPreferences, nextReminders] = await Promise.all([
      getReminderPreferences(userId),
      listUserReminders(userId)
    ])
    setPreferences(nextPreferences)
    setReminders(nextReminders)
    setError('')
    return nextReminders
  }, [userId])

  useEffect(() => {
    if (!userId) return undefined

    let active = true
    async function syncReminders() {
      try {
        const [nextPreferences, nextReminders] = await Promise.all([
          getReminderPreferences(userId),
          listUserReminders(userId)
        ])
        if (!active) return
        setPreferences(nextPreferences)
        setReminders(nextReminders)
        setError('')

        if (!nextPreferences.in_app_enabled) {
          setToasts([])
          return
        }
        const due = await listDueReminders(userId)
        if (!active || due.length === 0) return

        const delivered = await Promise.all(
          due.map(async (reminder) => {
            const updated = await markReminderNotified(reminder.id, userId)
            return updated ? { ...reminder, ...updated } : null
          })
        )
        const newToasts = delivered.filter(Boolean)
        if (newToasts.length > 0 && active) {
          setToasts((current) => {
            const known = new Set(current.map((item) => item.id))
            return [...current, ...newToasts.filter((item) => !known.has(item.id))]
          })
          const latest = await listUserReminders(userId)
          if (active) setReminders(latest)
        }
      } catch (syncError) {
        if (active) setError(syncError.message || 'Não foi possível carregar os lembretes.')
      }
    }

    syncReminders()
    const intervalId = window.setInterval(syncReminders, POLL_INTERVAL_MS)
    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [userId])

  const dismiss = useCallback(async (reminderId) => {
    await dismissReminderRecord(reminderId, userId)
    setToasts((current) => current.filter((item) => item.id !== reminderId))
    await refresh()
  }, [refresh, userId])

  const snooze = useCallback(async (reminderId, minutes = 15) => {
    await snoozeReminderRecord(reminderId, minutes, userId)
    setToasts((current) => current.filter((item) => item.id !== reminderId))
    await refresh()
  }, [refresh, userId])

  const complete = useCallback(async (reminder) => {
    await setTaskStatus(reminder.task_id, 'done')
    bump()
    setToasts((current) => current.filter((item) => item.id !== reminder.id))
    await refresh()
  }, [bump, refresh])

  const savePreferences = useCallback(async (patch) => {
    const next = { ...preferences, ...patch }
    const saved = await saveReminderPreferences(userId, next)
    setPreferences(saved)
    await refresh()
    return saved
  }, [preferences, refresh, userId])

  return { reminders, toasts, preferences, error, refresh, dismiss, snooze, complete, savePreferences }
}
