import { supabase } from '../supabase/client.js'

async function invokeGoogleCalendar(action, extra = {}) {
  const { data, error } = await supabase.functions.invoke('google-calendar', { body: { action, ...extra } })
  if (error) {
    try {
      const body = await error.context?.json()
      if (body?.error) throw new Error(body.error)
    } catch (responseError) {
      if (responseError instanceof Error && responseError.message !== 'Unexpected end of JSON input') throw responseError
    }
    throw error
  }
  if (data?.error) throw new Error(data.error)
  return data
}

export async function getGoogleCalendarIntegration(userId) {
  const { data, error } = await supabase
    .from('google_calendar_integration')
    .select('user_id, selected_calendar_id, selected_calendar_summary, selected_calendar_time_zone, sync_enabled, last_synced_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function listGoogleCalendarSyncLogs(userId) {
  const { data, error } = await supabase
    .from('calendar_sync_logs')
    .select('id, direction, status, message, imported_count, exported_count, conflict_count, started_at, completed_at')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(10)
  if (error) throw error
  return data
}

export async function beginGoogleCalendarConnection() {
  return invokeGoogleCalendar('begin')
}

export async function listGoogleCalendars() {
  const result = await invokeGoogleCalendar('calendars')
  return result.calendars
}

export async function selectGoogleCalendar(calendarId) {
  return invokeGoogleCalendar('select-calendar', { calendarId })
}

export async function syncGoogleCalendar() {
  return invokeGoogleCalendar('sync')
}

export async function disconnectGoogleCalendar() {
  const result = await invokeGoogleCalendar('disconnect')
  window.dispatchEvent(new Event('devcodes:calendar-sync-config'))
  return result
}

export async function setGoogleCalendarAutoSync(enabled) {
  const result = await invokeGoogleCalendar('set-auto-sync', { enabled })
  window.dispatchEvent(new Event('devcodes:calendar-sync-config'))
  return result.syncEnabled
}

export async function getIcsCalendarFeedStatus() {
  return invokeGoogleCalendar('feed-status')
}

export async function createIcsCalendarFeed() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  return invokeGoogleCalendar('create-feed', { timeZone })
}

export async function revokeIcsCalendarFeed() {
  return invokeGoogleCalendar('revoke-feed')
}

export async function listGoogleMappedEventIds(eventIds) {
  if (eventIds.length === 0) return new Set()
  const { data, error } = await supabase
    .from('event_google_mapping')
    .select('event_id')
    .in('event_id', eventIds)
  if (error) throw error
  return new Set(data.map((row) => row.event_id).filter(Boolean))
}
