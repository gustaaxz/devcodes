import { useCallback, useEffect, useRef, useState } from 'react'
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
  const suppressedToasts = useRef(new Map())

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
            const suppressedUntil = suppressedToasts.current.get(reminder.id)
            const dueTime = new Date(reminder.remind_at).getTime()
            if (suppressedUntil === Infinity || (suppressedUntil && dueTime < suppressedUntil)) return null
            if (suppressedUntil && dueTime >= suppressedUntil) suppressedToasts.current.delete(reminder.id)
            const updated = await markReminderNotified(reminder.id, userId, reminder.remind_at)
            if (!updated || updated.status !== 'notified' || new Date(updated.remind_at) > new Date()) return null
            return updated ? { ...reminder, ...updated } : null
          })
        )
        const newToasts = delivered.filter(Boolean)
        if (newToasts.length > 0 && active) {
          setToasts((current) => {
            const known = new Set(current.map((item) => item.id))
            return [...current, ...newToasts.filter((item) => !known.has(item.id) && !suppressedToasts.current.has(item.id))]
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
    const previous = toasts.find((item) => item.id === reminderId)
    suppressedToasts.current.set(reminderId, Infinity)
    setToasts((current) => current.filter((item) => item.id !== reminderId))
    try {
      await dismissReminderRecord(reminderId, userId)
    } catch (actionError) {
      suppressedToasts.current.delete(reminderId)
      if (previous) setToasts((current) => current.some((item) => item.id === reminderId) ? current : [...current, previous])
      throw actionError
    }
    await refresh()
  }, [refresh, toasts, userId])

  const snooze = useCallback(async (reminderId, minutes = 15) => {
    const previous = toasts.find((item) => item.id === reminderId)
    const snoozedUntil = Date.now() + minutes * 60 * 1000
    suppressedToasts.current.set(reminderId, snoozedUntil)
    setToasts((current) => current.filter((item) => item.id !== reminderId))
    try {
      await snoozeReminderRecord(reminderId, minutes, userId)
    } catch (actionError) {
      suppressedToasts.current.delete(reminderId)
      if (previous) setToasts((current) => current.some((item) => item.id === reminderId) ? current : [...current, previous])
      throw actionError
    }
    await refresh()
  }, [refresh, toasts, userId])

  const complete = useCallback(async (reminder) => {
    const previous = toasts.find((item) => item.id === reminder.id)
    suppressedToasts.current.set(reminder.id, Infinity)
    setToasts((current) => current.filter((item) => item.id !== reminder.id))
    try {
      await setTaskStatus(reminder.task_id, 'done')
      bump()
    } catch (actionError) {
      suppressedToasts.current.delete(reminder.id)
      if (previous) setToasts((current) => current.some((item) => item.id === reminder.id) ? current : [...current, previous])
      throw actionError
    }
    await refresh()
  }, [bump, refresh, toasts])

  const savePreferences = useCallback(async (patch) => {
    const next = { ...preferences, ...patch }
    const saved = await saveReminderPreferences(userId, next)
    setPreferences(saved)
    await refresh()
    return saved
  }, [preferences, refresh, userId])

  return { reminders, toasts, preferences, error, refresh, dismiss, snooze, complete, savePreferences }
}
