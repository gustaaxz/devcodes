import { describe, expect, it } from 'vitest'
import { parseIcsCalendar, serializeIcsCalendar } from './icalService.js'

const baseCalendar = (event) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\n${event}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`

describe('iCalendar import/export', () => {
  it('parses UTC events and unescapes text and folded lines', () => {
    const longTitle = 'Revisão de arquitetura com integração contínua e documentação detalhada'
    const foldedTitle = `SUMMARY:${longTitle.slice(0, 35)}\r\n ${longTitle.slice(35)}`
    const events = parseIcsCalendar(baseCalendar([
      'UID:event-1@example.test',
      'DTSTART:20261029T130000Z',
      'DTEND:20261029T143000Z',
      foldedTitle,
      'DESCRIPTION:Plano\\ncom virgula\\, e ponto\\; final'
    ].join('\r\n')))

    expect(events[0]).toMatchObject({
      title: longTitle,
      description: 'Plano\ncom virgula, e ponto; final',
      start_at: '2026-10-29T13:00:00.000Z',
      end_at: '2026-10-29T14:30:00.000Z',
      ical_uid: 'event-1@example.test'
    })
  })

  it('converts a TZID local time to its matching UTC instant', () => {
    const [event] = parseIcsCalendar(baseCalendar([
      'UID:saopaulo@example.test',
      'DTSTART;TZID=America/Sao_Paulo:20261029T100000',
      'SUMMARY:Reunião'
    ].join('\r\n')))

    expect(event.start_at).toBe('2026-10-29T13:00:00.000Z')
  })

  it('uses a positive RFC 5545 duration when DTEND is absent', () => {
    const [event] = parseIcsCalendar(baseCalendar([
      'UID:duration@example.test',
      'DTSTART:20261029T130000Z',
      'DURATION:PT90M',
      'SUMMARY:Evento com duração'
    ].join('\r\n')))

    expect(event.end_at).toBe('2026-10-29T14:30:00.000Z')
  })

  it('round-trips timed and all-day events and folds UTF-8 lines within 75 octets', () => {
    const events = [
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        title: 'Planejamento, revisão; entrega',
        description: 'Detalhes com acentuação '.repeat(5),
        start_at: '2026-10-29T13:00:00.000Z',
        end_at: '2026-10-29T14:00:00.000Z',
        status: 'scheduled'
      },
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        title: 'Dia de estudos',
        start_at: new Date(2026, 9, 30, 0, 0).toISOString(),
        end_at: null,
        status: 'cancelled'
      }
    ]
    const content = serializeIcsCalendar(events, new Date('2026-10-27T00:00:00.000Z'))
    const physicalLines = content.split('\r\n').filter(Boolean)
    expect(physicalLines.every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true)
    expect(content).toContain('DTSTART;VALUE=DATE:20261030')
    expect(content).toContain('STATUS:CANCELLED')

    const parsed = parseIcsCalendar(content)
    expect(parsed[0]).toMatchObject({
      title: events[0].title,
      description: events[0].description,
      start_at: events[0].start_at,
      end_at: events[0].end_at
    })
    expect(parsed[1]).toMatchObject({ title: events[1].title, end_at: null, status: 'cancelled' })
  })

  it('rejects recurring events, duplicate UIDs, and malformed calendars', () => {
    expect(() => parseIcsCalendar(baseCalendar('UID:x\nDTSTART:20261029T130000Z\nSUMMARY:Evento\nRRULE:FREQ=DAILY')))
      .toThrow('Eventos recorrentes')
    expect(() => parseIcsCalendar(`BEGIN:VCALENDAR\n${'BEGIN:VEVENT\nUID:x\nDTSTART:20261029T130000Z\nSUMMARY:Evento\nEND:VEVENT\n'.repeat(2)}END:VCALENDAR`))
      .toThrow('UID duplicado')
    expect(() => parseIcsCalendar('BEGIN:VCALENDAR\nEND:VCALENDAR')).toThrow('não contém eventos')
  })
})
