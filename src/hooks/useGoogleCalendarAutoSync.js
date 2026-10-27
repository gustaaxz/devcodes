import { useEffect, useRef } from 'react'
import { supabase } from '../services/supabase/client.js'
import { getGoogleCalendarIntegration, syncGoogleCalendar } from '../services/calendar/googleCalendarService.js'
import { useLoad } from './useLoad.js'

const AUTO_SYNC_INTERVAL = 5 * 60 * 1000

export function useGoogleCalendarAutoSync(userId) {
  const integration = useLoad(() => userId ? getGoogleCalendarIntegration(userId) : Promise.resolve(null), userId || '')
  const syncingRef = useRef(false)
  const reloadIntegration = integration.reload

  useEffect(() => {
    if (!userId || !integration.data?.sync_enabled) return undefined
    let active = true
    let debounceTimer

    async function syncIfIdle() {
      if (!active || syncingRef.current || document.visibilityState === 'hidden') return
      syncingRef.current = true
      try {
        await syncGoogleCalendar()
      } catch {
        // The Edge Function records sync failures for the Settings history.
      } finally {
        syncingRef.current = false
      }
    }

    function scheduleSync() {
      clearTimeout(debounceTimer)
      debounceTimer = window.setTimeout(syncIfIdle, 2500)
    }

    const channel = supabase
      .channel(`google-calendar-auto-sync-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `user_id=eq.${userId}` }, scheduleSync)
      .subscribe()
    const interval = window.setInterval(syncIfIdle, AUTO_SYNC_INTERVAL)
    const configurationChanged = () => reloadIntegration()
    const onVisibility = () => { if (document.visibilityState === 'visible') syncIfIdle() }
    window.addEventListener('online', syncIfIdle)
    window.addEventListener('devcodes:calendar-sync-config', configurationChanged)
    document.addEventListener('visibilitychange', onVisibility)
    syncIfIdle()

    return () => {
      active = false
      clearTimeout(debounceTimer)
      clearInterval(interval)
      window.removeEventListener('online', syncIfIdle)
      window.removeEventListener('devcodes:calendar-sync-config', configurationChanged)
      document.removeEventListener('visibilitychange', onVisibility)
      supabase.removeChannel(channel)
    }
  }, [userId, integration.data?.sync_enabled, reloadIntegration])
}
