import { isAllDayEvent } from '../../utils/dates.js'
import { supabase } from '../supabase/client.js'

const MAX_ICAL_BYTES = 2 * 1024 * 1024
const MAX_ICAL_EVENTS = 500

function unfoldLines(source) {
  const lines = String(source).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const unfolded = []
  for (const line of lines) {
    if (/^[ \t]/.test(line) && unfolded.length) unfolded[unfolded.length - 1] += line.slice(1)
    else if (line) unfolded.push(line)
  }
  return unfolded
}

function parseProperty(line) {
  const separator = line.indexOf(':')
  if (separator < 1) throw new Error('Arquivo iCalendar inválido: propriedade sem valor.')
  const [name, ...parameterParts] = line.slice(0, separator).split(';')
  const parameters = Object.fromEntries(parameterParts.map((part) => {
    const index = part.indexOf('=')
    if (index < 1) return [part.toUpperCase(), '']
    return [part.slice(0, index).toUpperCase(), part.slice(index + 1).replace(/^"|"$/g, '')]
  }))
  return { name: name.toUpperCase(), parameters, value: line.slice(separator + 1) }
}

function unescapeText(value) {
  return value.replace(/\\([\\,;nN])/g, (_, escaped) => {
    if (escaped.toLowerCase() === 'n') return '\n'
    return escaped
  })
}

function escapeText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function parseIcsDuration(value) {
  const match = value.match(/^P(?:(\d+)W|(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?)$/)
  if (!match || !match.slice(1).some(Boolean)) throw new Error('Duração iCalendar inválida.')
  const [, weeks = '0', days = '0', hours = '0', minutes = '0', seconds = '0'] = match
  const milliseconds = ((Number(weeks) * 7 + Number(days)) * 24 + Number(hours)) * 60 * 60 * 1000 +
    (Number(minutes) * 60 + Number(seconds)) * 1000
  if (milliseconds <= 0) throw new Error('Duração iCalendar precisa ser maior que zero.')
  return milliseconds
}

function parseIcsDate(property) {
  const { value, parameters } = property
  const dateOnly = parameters.VALUE === 'DATE' || /^\d{8}$/.test(value)
  const match = dateOnly
    ? value.match(/^(\d{4})(\d{2})(\d{2})$/)
    : value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/)
  if (!match) throw new Error('Data de evento iCalendar inválida.')

  const [, year, month, day, hour = '00', minute = '00', second = '00', utc] = match
  const parts = [year, month, day, hour, minute, second].map(Number)
  const [y, m, d, h, min, s] = parts
  const check = new Date(Date.UTC(y, m - 1, d, h, min, s))
  if (
    check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d ||
    check.getUTCHours() !== h || check.getUTCMinutes() !== min || check.getUTCSeconds() !== s
  ) throw new Error('Data de evento iCalendar inválida.')

  if (dateOnly) return { date: new Date(y, m - 1, d), allDay: true }
  if (utc) return { date: new Date(Date.UTC(y, m - 1, d, h, min, s)), allDay: false }

  const timeZone = parameters.TZID
  if (!timeZone) return { date: new Date(y, m - 1, d, h, min, s), allDay: false }

  try {
    const target = Date.UTC(y, m - 1, d, h, min, s)
    const offsetAt = (instant) => {
      const values = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).formatToParts(new Date(instant)).map((part) => [part.type, part.value]))
      return Date.UTC(+values.year, +values.month - 1, +values.day, +values.hour, +values.minute, +values.second) - instant
    }
    let instant = target - offsetAt(target)
    instant = target - offsetAt(instant)
    return { date: new Date(instant), allDay: false }
  } catch {
    throw new Error(`Fuso horário iCalendar não reconhecido: ${timeZone}.`)
  }
}

function eventFromProperties(properties) {
  if (properties.has('RRULE') || properties.has('RECURRENCE-ID')) {
    throw new Error('Eventos recorrentes não são suportados nesta importação iCalendar.')
  }
  const startProperty = properties.get('DTSTART')
  if (!startProperty) throw new Error('Evento iCalendar sem data de início.')
  const start = parseIcsDate(startProperty)
  const endProperty = properties.get('DTEND')
  const duration = properties.get('DURATION')?.value
  if (endProperty && duration) throw new Error('Evento iCalendar não pode ter DTEND e DURATION ao mesmo tempo.')
  const end = endProperty
    ? parseIcsDate(endProperty)
    : duration
      ? { date: new Date(start.date.getTime() + parseIcsDuration(duration)), allDay: start.allDay }
      : null
  if (end && end.date < start.date) throw new Error('O término do evento antecede o início.')

  const title = unescapeText(properties.get('SUMMARY')?.value || '').trim()
  if (!title) throw new Error('Evento iCalendar sem título.')
  const status = properties.get('STATUS')?.value?.toUpperCase() === 'CANCELLED' ? 'cancelled' : 'scheduled'
  const uid = properties.get('UID')?.value?.trim() || null

  return {
    title: title.slice(0, 200),
    description: properties.has('DESCRIPTION') ? unescapeText(properties.get('DESCRIPTION').value).slice(0, 10_000) : null,
    start_at: start.date.toISOString(),
    end_at: start.allDay ? null : end?.date.toISOString() ?? null,
    status,
    priority: 'medium',
    reminder_at: null,
    ical_uid: uid
  }
}

export function parseIcsCalendar(source) {
  if (typeof source !== 'string' || !source.trim()) throw new Error('O arquivo iCalendar está vazio.')
  if (new TextEncoder().encode(source).length > MAX_ICAL_BYTES) throw new Error('O arquivo iCalendar excede 2 MB.')
  const lines = unfoldLines(source)
  if (!lines.includes('BEGIN:VCALENDAR') || !lines.includes('END:VCALENDAR')) {
    throw new Error('Arquivo iCalendar inválido: contêiner VCALENDAR ausente ou incompleto.')
  }

  const events = []
  let properties = null
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      if (properties) throw new Error('Arquivo iCalendar inválido: evento aninhado.')
      properties = new Map()
    } else if (line === 'END:VEVENT') {
      if (!properties) throw new Error('Arquivo iCalendar inválido: evento sem início.')
      events.push(eventFromProperties(properties))
      properties = null
      if (events.length > MAX_ICAL_EVENTS) throw new Error(`O arquivo excede o limite de ${MAX_ICAL_EVENTS} eventos.`)
    } else if (properties) {
      const property = parseProperty(line)
      if (properties.has(property.name) && ['UID', 'DTSTART', 'DTEND', 'SUMMARY', 'DESCRIPTION', 'STATUS'].includes(property.name)) {
        throw new Error(`Evento iCalendar contém a propriedade ${property.name} mais de uma vez.`)
      }
      properties.set(property.name, property)
    }
  }
  if (properties) throw new Error('Arquivo iCalendar inválido: evento não foi fechado.')
  if (!events.length) throw new Error('O arquivo não contém eventos compatíveis.')
  const uids = events.map((event) => event.ical_uid).filter(Boolean)
  if (new Set(uids).size !== uids.length) throw new Error('O arquivo contém eventos com UID duplicado.')
  return events
}

function formatIcsDate(value, dateOnly = false) {
  const date = new Date(value)
  const pad = (part) => String(part).padStart(2, '0')
  const year = dateOnly ? date.getFullYear() : date.getUTCFullYear()
  const month = dateOnly ? date.getMonth() + 1 : date.getUTCMonth() + 1
  const dayOfMonth = dateOnly ? date.getDate() : date.getUTCDate()
  const day = `${year}${pad(month)}${pad(dayOfMonth)}`
  if (dateOnly) return day
  return `${day}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
}

function foldLine(line) {
  const chunks = []
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

export function serializeIcsCalendar(events, now = new Date()) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DevCodes//Calendar//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ]

  for (const event of events || []) {
    const dateOnly = isAllDayEvent(event)
    const uid = event.ical_uid || `${event.id}@devcodes.local`
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid.replace(/[\r\n]/g, '')}`)
    lines.push(`DTSTAMP:${formatIcsDate(event.updated_at || now.toISOString())}`)
    lines.push(`${dateOnly ? 'DTSTART;VALUE=DATE' : 'DTSTART'}:${formatIcsDate(event.start_at, dateOnly)}`)
    if (event.end_at && !dateOnly) lines.push(`DTEND:${formatIcsDate(event.end_at)}`)
    lines.push(`SUMMARY:${escapeText(event.title)}`)
    if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`)
    if (event.status === 'cancelled') lines.push('STATUS:CANCELLED')
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return `${lines.map(foldLine).join('\r\n')}\r\n`
}

export async function exportEventsAsIcs() {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  const userId = authData.user?.id
  if (!userId) throw new Error('Entre na sua conta para exportar eventos.')
  const { data, error } = await supabase
    .from('events')
    .select('id, title, description, start_at, end_at, status, updated_at, ical_uid')
    .eq('user_id', userId)
    .order('start_at')
  if (error) throw error

  const content = serializeIcsCalendar(data)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `devcodes-calendar-${new Date().toISOString().slice(0, 10)}.ics`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function importEventsFromIcs(events, userId) {
  if (!userId) throw new Error('Entre na sua conta para importar eventos.')
  const withUid = events.filter((event) => event.ical_uid)
  const knownUids = new Set()
  for (let index = 0; index < withUid.length; index += 100) {
    const batch = withUid.slice(index, index + 100)
    const { data, error } = await supabase
      .from('events')
      .select('ical_uid')
      .eq('user_id', userId)
      .in('ical_uid', batch.map((event) => event.ical_uid))
    if (error) throw error
    for (const event of data) knownUids.add(event.ical_uid)
  }

  const localIds = withUid
    .map((event) => event.ical_uid.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})@devcodes\.local$/i)?.[1])
    .filter(Boolean)
  const knownLocalIds = new Set()
  for (let index = 0; index < localIds.length; index += 100) {
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .eq('user_id', userId)
      .in('id', localIds.slice(index, index + 100))
    if (error) throw error
    for (const event of data) knownLocalIds.add(event.id.toLowerCase())
  }

  const rows = events
    .filter((event) => {
      if (!event.ical_uid) return true
      const localId = event.ical_uid.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})@devcodes\.local$/i)?.[1]
      return !knownUids.has(event.ical_uid) && (!localId || !knownLocalIds.has(localId.toLowerCase()))
    })
    .map(({ ical_uid: icalUid, ...event }) => ({
      ...event,
      ical_uid: icalUid,
      user_id: userId
    }))
  if (rows.length) {
    const { error } = await supabase.from('events').insert(rows)
    if (error) throw error
  }
  return { imported: rows.length, skipped: events.length - rows.length }
}
