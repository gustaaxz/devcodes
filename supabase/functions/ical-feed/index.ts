import { createAdminClient, sha256 } from '../_shared/googleCalendar.ts'

function escapeText(value: string) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

function foldLine(line: string) {
  const chunks: string[] = []
  let current = ''
  let bytes = 0
  for (const character of line) {
    const size = new TextEncoder().encode(character).length
    if (bytes + size > 75) {
      chunks.push(current)
      current = ` ${character}`
      bytes = 1 + size
    } else {
      current += character
      bytes += size
    }
  }
  chunks.push(current)
  return chunks.join('\r\n')
}

function getLocalParts(value: string, timeZone: string) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).formatToParts(new Date(value)).map((part) => [part.type, part.value]))
}

function formatUtc(value: string) {
  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
}

function formatLocalDate(parts: Record<string, string>) {
  return `${parts.year}${parts.month}${parts.day}`
}

function nextDate(year: string, month: string, day: string) {
  const date = new Date(Date.UTC(+year, +month - 1, +day + 1))
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`
}

function serializeEvents(events: Record<string, any>[], timeZone: string) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DevCodes//Calendar Feed//PT-BR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']
  for (const event of events) {
    const start = getLocalParts(event.start_at, timeZone)
    const allDay = start.hour === '00' && start.minute === '00' && !event.end_at
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${String(event.ical_uid || `${event.id}@devcodes.local`).replace(/[\r\n]/g, '')}`)
    lines.push(`DTSTAMP:${formatUtc(event.updated_at || new Date().toISOString())}`)
    if (allDay) {
      lines.push(`DTSTART;VALUE=DATE:${formatLocalDate(start)}`)
      lines.push(`DTEND;VALUE=DATE:${nextDate(start.year, start.month, start.day)}`)
    } else {
      lines.push(`DTSTART:${formatUtc(event.start_at)}`)
      if (event.end_at) lines.push(`DTEND:${formatUtc(event.end_at)}`)
    }
    lines.push(`SUMMARY:${escapeText(event.title)}`)
    if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`)
    if (event.status === 'cancelled') lines.push('STATUS:CANCELLED')
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return `${lines.map(foldLine).join('\r\n')}\r\n`
}

Deno.serve(async (request) => {
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 })
  const token = new URL(request.url).searchParams.get('token') || ''
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return new Response('Feed not found', { status: 404 })

  const admin = createAdminClient()
  const { data: feed, error: feedError } = await admin
    .from('ical_calendar_feeds')
    .select('user_id, time_zone')
    .eq('token_hash', await sha256(token))
    .maybeSingle()
  if (feedError || !feed) return new Response('Feed not found', { status: 404 })

  const { data: events, error } = await admin
    .from('events')
    .select('id, title, description, start_at, end_at, status, updated_at, ical_uid')
    .eq('user_id', feed.user_id)
    .order('start_at')
  if (error) return new Response('Feed unavailable', { status: 503 })
  await admin.from('ical_calendar_feeds').update({ last_accessed_at: new Date().toISOString() }).eq('user_id', feed.user_id)

  return new Response(serializeEvents(events, feed.time_zone || 'UTC'), {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="devcodes-calendar.ics"',
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff'
    }
  })
})
