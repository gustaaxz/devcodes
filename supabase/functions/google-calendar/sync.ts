import { createAdminClient } from '../_shared/googleCalendar.ts'
import { compareCalendarVersions } from '../../../src/services/calendar/googleCalendarSyncPolicy.js'

type AdminClient = ReturnType<typeof createAdminClient>

function googleDateToIso(value: Record<string, string> | undefined, timeZone: string) {
  if (!value) throw new Error('Evento Google sem início.')
  if (value.dateTime) {
    const date = new Date(value.dateTime)
    if (!Number.isFinite(date.getTime())) throw new Error('Data Google inválida.')
    return date.toISOString()
  }
  if (!value.date || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) throw new Error('Data Google inválida.')
  const [year, month, day] = value.date.split('-').map(Number)
  const target = Date.UTC(year, month - 1, day)
  const offsetAt = (instant: number) => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).formatToParts(new Date(instant)).map((part) => [part.type, part.value]))
    return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second) - instant
  }
  let instant = target - offsetAt(target)
  instant = target - offsetAt(instant)
  return new Date(instant).toISOString()
}

function localParts(value: string, timeZone: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).formatToParts(new Date(value)).map((part) => [part.type, part.value]))
  return parts
}

function nextDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + 1))
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`
}

function toGoogleEvent(event: Record<string, any>, timeZone: string) {
  const startParts = localParts(event.start_at, timeZone)
  const isAllDay = startParts.hour === '00' && startParts.minute === '00' && !event.end_at
  const result: Record<string, unknown> = {
    summary: event.title,
    description: event.description || undefined,
    status: event.status === 'cancelled' ? 'cancelled' : 'confirmed',
    extendedProperties: {
      private: {
        devcodesEventId: event.id,
        devcodesNoEnd: event.end_at ? 'false' : 'true'
      }
    }
  }
  if (isAllDay) {
    const date = `${startParts.year}-${startParts.month}-${startParts.day}`
    result.start = { date }
    result.end = { date: nextDate(date) }
  } else {
    const start = new Date(event.start_at)
    const end = event.end_at ? new Date(event.end_at) : new Date(start.getTime() + 60 * 60 * 1000)
    result.start = { dateTime: start.toISOString(), timeZone }
    result.end = { dateTime: end.toISOString(), timeZone }
  }
  return result
}

function fromGoogleEvent(event: Record<string, any>, timeZone: string) {
  const start = googleDateToIso(event.start, timeZone)
  const noEnd = event.extendedProperties?.private?.devcodesNoEnd === 'true'
  const end = noEnd || !event.end ? null : googleDateToIso(event.end, timeZone)
  return {
    title: String(event.summary || 'Evento sem título').trim().slice(0, 200) || 'Evento sem título',
    description: typeof event.description === 'string' ? event.description.slice(0, 10_000) : null,
    start_at: start,
    end_at: end,
    status: event.status === 'cancelled' ? 'cancelled' : 'scheduled'
  }
}

async function listGoogleEvents(accessToken: string, calendarId: string, syncToken: string | null) {
  const items: Record<string, any>[] = []
  let pageToken: string | undefined
  let nextSyncToken: string | null = null
  let tokenExpired = false
  do {
    const params = new URLSearchParams({ singleEvents: 'false', showDeleted: 'true', maxResults: '2500' })
    if (syncToken && !tokenExpired) params.set('syncToken', syncToken)
    if (pageToken) params.set('pageToken', pageToken)
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`
    const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (response.status === 410 && syncToken && !tokenExpired) {
      tokenExpired = true
      pageToken = undefined
      items.length = 0
      continue
    }
    const result = await response.json()
    if (!response.ok) throw new Error('O Google Calendar não retornou os eventos. Tente novamente.')
    items.push(...(result.items || []))
    pageToken = result.nextPageToken
    if (!pageToken) nextSyncToken = result.nextSyncToken || null
    if (items.length > 100_000) throw new Error('O calendário excede o limite de eventos por sincronização.')
  } while (pageToken)
  return { items, nextSyncToken, tokenExpired }
}

async function googleEventRequest(accessToken: string, calendarId: string, eventId: string | null, method: string, body?: unknown) {
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  const url = eventId ? `${base}/${encodeURIComponent(eventId)}` : base
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  })
  if (method === 'DELETE' && [404, 410].includes(response.status)) return null
  const result = response.status === 204 ? null : await response.json()
  if (!response.ok) throw new Error('Uma alteração no Google Calendar falhou durante a sincronização.')
  return result
}

async function saveMapping(admin: AdminClient, row: Record<string, unknown>) {
  const { error } = await admin.from('event_google_mapping').upsert(row, {
    onConflict: 'user_id,calendar_id,google_event_id'
  })
  if (error) throw error
}

export async function syncGoogleCalendar(admin: AdminClient, userId: string, accessToken: string) {
  const { data: integration, error: integrationError } = await admin
    .from('google_calendar_integration')
    .select('selected_calendar_id, selected_calendar_time_zone, sync_token')
    .eq('user_id', userId)
    .single()
  if (integrationError) throw integrationError

  const calendarId = integration.selected_calendar_id
  const timeZone = integration.selected_calendar_time_zone || 'UTC'
  const startedAt = new Date().toISOString()
  const staleLock = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { data: lock, error: lockError } = await admin.from('google_calendar_integration')
    .update({ sync_locked_at: startedAt })
    .eq('user_id', userId)
    .or(`sync_locked_at.is.null,sync_locked_at.lt.${staleLock}`)
    .select('user_id')
    .maybeSingle()
  if (lockError) throw lockError
  if (!lock) throw new Error('Uma sincronização deste calendário já está em andamento.')

  const { data: log, error: logError } = await admin.from('calendar_sync_logs').insert({
    user_id: userId,
    direction: 'bidirectional',
    status: 'running',
    started_at: startedAt
  }).select('id').single()
  if (logError) throw logError

  let imported = 0
  let exported = 0
  let conflicts = 0
  let skippedRecurring = 0
  try {
    const access = await listGoogleEvents(accessToken, calendarId, integration.sync_token)
    const { data: originalEvents, error: eventsError } = await admin.from('events').select('*').eq('user_id', userId)
    if (eventsError) throw eventsError
    const { data: originalMappings, error: mappingsError } = await admin
      .from('event_google_mapping').select('*').eq('user_id', userId).eq('calendar_id', calendarId)
    if (mappingsError) throw mappingsError

    const eventById = new Map(originalEvents.map((event: Record<string, any>) => [event.id, event]))
    const mappingByGoogleId = new Map(originalMappings.map((mapping: Record<string, any>) => [mapping.google_event_id, mapping]))
    const mappedLocalIds = new Set(originalMappings.map((mapping: Record<string, any>) => mapping.event_id).filter(Boolean))

    for (const googleEvent of access.items) {
      if (googleEvent.recurrence?.length || googleEvent.recurringEventId) {
        skippedRecurring += 1
        continue
      }
      let mapping = mappingByGoogleId.get(googleEvent.id)
      if (googleEvent.status === 'cancelled') {
        if (!mapping) continue
        const local = eventById.get(mapping.event_id)
        if (local && local.status !== 'cancelled') {
          if (compareCalendarVersions(local, mapping, googleEvent).localChanged) {
            conflicts += 1
            const { error } = await admin.from('event_google_mapping').delete().eq('id', mapping.id).eq('user_id', userId)
            if (error) throw error
          }
          else {
            const { data: updated, error } = await admin.from('events').update({ status: 'cancelled' }).eq('id', local.id).select('*').single()
            if (error) throw error
            eventById.set(updated.id, updated)
            await saveMapping(admin, {
              ...mapping,
              local_updated_at: updated.updated_at,
              google_updated_at: googleEvent.updated || mapping.google_updated_at,
              google_etag: googleEvent.etag || mapping.google_etag,
              synced_at: new Date().toISOString()
            })
          }
        }
        continue
      }

      const comparison = compareCalendarVersions(null, mapping, googleEvent)
      const remoteUpdated = comparison.remoteChanged
      if (!mapping) {
        const devcodesEventId = googleEvent.extendedProperties?.private?.devcodesEventId
        const payload = fromGoogleEvent(googleEvent, timeZone)
        const exactMatch = [...eventById.values()].find((event: Record<string, any>) =>
          !mappedLocalIds.has(event.id) &&
          event.status === payload.status &&
          event.title === payload.title &&
          new Date(event.start_at).getTime() === new Date(payload.start_at).getTime() &&
          (event.end_at ? new Date(event.end_at).getTime() : null) === (payload.end_at ? new Date(payload.end_at).getTime() : null)
        )
        const markedLocal = devcodesEventId ? eventById.get(devcodesEventId) : null
        const existingLocal = (markedLocal && !mappedLocalIds.has(markedLocal.id) ? markedLocal : null) || exactMatch
        if (existingLocal) {
          mappedLocalIds.add(existingLocal.id)
          await saveMapping(admin, {
            user_id: userId,
            event_id: existingLocal.id,
            calendar_id: calendarId,
            google_event_id: googleEvent.id,
            google_etag: googleEvent.etag || null,
            local_updated_at: existingLocal.updated_at,
            google_updated_at: googleEvent.updated || null,
            synced_at: new Date().toISOString()
          })
          mapping = { event_id: existingLocal.id, local_updated_at: existingLocal.updated_at, google_updated_at: googleEvent.updated, google_etag: googleEvent.etag }
          mappingByGoogleId.set(googleEvent.id, mapping)
          continue
        }

        const { data: created, error } = await admin.from('events').insert({
          ...payload,
          user_id: userId,
          category_id: null,
          priority: 'medium',
          reminder_at: null
        }).select('*').single()
        if (error) throw error
        eventById.set(created.id, created)
        mappedLocalIds.add(created.id)
        await saveMapping(admin, {
          user_id: userId,
          event_id: created.id,
          calendar_id: calendarId,
          google_event_id: googleEvent.id,
          google_etag: googleEvent.etag || null,
          local_updated_at: created.updated_at,
          google_updated_at: googleEvent.updated || null,
          synced_at: new Date().toISOString()
        })
        imported += 1
        continue
      }

      const local = eventById.get(mapping.event_id)
      if (!local) continue
      const versions = compareCalendarVersions(local, mapping, googleEvent)
      if (versions.conflict) {
        conflicts += 1
        continue
      }
      if (remoteUpdated) {
        const payload = fromGoogleEvent(googleEvent, timeZone)
        const { data: updated, error } = await admin.from('events').update(payload).eq('id', local.id).select('*').single()
        if (error) throw error
        eventById.set(updated.id, updated)
        await saveMapping(admin, {
          ...mapping,
          google_etag: googleEvent.etag || null,
          local_updated_at: updated.updated_at,
          google_updated_at: googleEvent.updated || null,
          synced_at: new Date().toISOString()
        })
      }
    }

    const { data: currentEvents, error: currentError } = await admin.from('events').select('*').eq('user_id', userId)
    if (currentError) throw currentError
    const { data: currentMappings, error: currentMappingsError } = await admin
      .from('event_google_mapping').select('*').eq('user_id', userId).eq('calendar_id', calendarId)
    if (currentMappingsError) throw currentMappingsError
    const localIds = new Set(currentEvents.map((event: Record<string, any>) => event.id))
    const mappingByEventId = new Map(currentMappings.filter((mapping: Record<string, any>) => mapping.event_id).map((mapping: Record<string, any>) => [mapping.event_id, mapping]))

    for (const mapping of currentMappings) {
      if (mapping.event_id && !localIds.has(mapping.event_id)) {
        await googleEventRequest(accessToken, calendarId, mapping.google_event_id, 'DELETE')
        const { error } = await admin.from('event_google_mapping').delete().eq('id', mapping.id).eq('user_id', userId)
        if (error) throw error
      }
    }

    for (const event of currentEvents) {
      let mapping = mappingByEventId.get(event.id)
      if (mapping) {
        if (!compareCalendarVersions(event, mapping, null).localChanged) continue
        if (event.status === 'cancelled') {
          await googleEventRequest(accessToken, calendarId, mapping.google_event_id, 'DELETE')
          const { error } = await admin.from('event_google_mapping').delete().eq('id', mapping.id).eq('user_id', userId)
          if (error) throw error
          exported += 1
          continue
        }
        const updated = await googleEventRequest(accessToken, calendarId, mapping.google_event_id, 'PATCH', toGoogleEvent(event, timeZone))
        await saveMapping(admin, {
          ...mapping,
          google_etag: updated?.etag || mapping.google_etag,
          local_updated_at: event.updated_at,
          google_updated_at: updated?.updated || new Date().toISOString(),
          synced_at: new Date().toISOString()
        })
        exported += 1
      } else if (event.status !== 'cancelled') {
        const created = await googleEventRequest(accessToken, calendarId, null, 'POST', toGoogleEvent(event, timeZone))
        await saveMapping(admin, {
          user_id: userId,
          event_id: event.id,
          calendar_id: calendarId,
          google_event_id: created.id,
          google_etag: created.etag || null,
          local_updated_at: event.updated_at,
          google_updated_at: created.updated || new Date().toISOString(),
          synced_at: new Date().toISOString()
        })
        exported += 1
      }
    }

    const { error: integrationUpdateError } = await admin.from('google_calendar_integration').update({
      sync_token: access.nextSyncToken,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('user_id', userId)
    if (integrationUpdateError) throw integrationUpdateError

    const partial = conflicts > 0 || skippedRecurring > 0
    const message = [
      conflicts ? `${conflicts} conflito(s) resolvido(s) com a versão DevCodes.` : '',
      skippedRecurring ? `${skippedRecurring} ocorrência(s) recorrente(s) ignorada(s), pois o DevCodes não oferece recorrência.` : ''
    ].filter(Boolean).join(' ')
    const { error: logUpdateError } = await admin.from('calendar_sync_logs').update({
      status: partial ? 'partial' : 'success',
      imported_count: imported,
      exported_count: exported,
      conflict_count: conflicts,
      message: message || 'Sincronização concluída.',
      completed_at: new Date().toISOString()
    }).eq('id', log.id).eq('user_id', userId)
    if (logUpdateError) throw logUpdateError
    return { imported, exported, conflicts, skippedRecurring, message: message || 'Sincronização concluída.' }
  } catch (error) {
    await admin.from('calendar_sync_logs').update({
      status: 'error',
      message: error instanceof Error ? error.message.slice(0, 500) : 'Falha na sincronização.',
      completed_at: new Date().toISOString()
    }).eq('id', log.id).eq('user_id', userId)
    throw error
  } finally {
    await admin.from('google_calendar_integration')
      .update({ sync_locked_at: null })
      .eq('user_id', userId)
      .eq('sync_locked_at', startedAt)
  }
}
