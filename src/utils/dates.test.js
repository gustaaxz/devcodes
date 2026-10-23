import { describe, expect, it } from 'vitest'
import {
  addMonths,
  buildMonthGrid,
  combineDateTime,
  fromDateKey,
  getWeekdays,
  isAllDayEvent,
  isSameDay,
  toDateKey,
  toDateTimeInput
} from './dates.js'

describe('datas', () => {
  it('converte chave de data de ida e volta sem alterar o dia', () => {
    expect(toDateKey(fromDateKey('2026-02-28'))).toBe('2026-02-28')
    expect(toDateKey(fromDateKey('2026-12-31'))).toBe('2026-12-31')
  })

  it('combina data e horario locais', () => {
    const date = combineDateTime('2026-10-22', '14:30')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(9)
    expect(date.getDate()).toBe(22)
    expect(date.getHours()).toBe(14)
    expect(date.getMinutes()).toBe(30)
    expect(toDateTimeInput(date)).toBe('2026-10-22T14:30')
  })

  it('monta grade mensal de 42 dias comecando no domingo ou na segunda', () => {
    const sunday = buildMonthGrid(new Date(2026, 9, 1), 0)
    const monday = buildMonthGrid(new Date(2026, 9, 1), 1)
    expect(sunday).toHaveLength(42)
    expect(sunday[0].getDay()).toBe(0)
    expect(monday[0].getDay()).toBe(1)
    expect(sunday.some((day) => toDateKey(day) === '2026-10-01')).toBe(true)
    expect(monday.some((day) => toDateKey(day) === '2026-10-31')).toBe(true)
  })

  it('reordena os dias da semana conforme o primeiro dia', () => {
    expect(getWeekdays(0)[0]).toBe('Dom')
    expect(getWeekdays(1)[0]).toBe('Seg')
    expect(getWeekdays(1)[6]).toBe('Dom')
  })

  it('navega entre meses atravessando o ano', () => {
    expect(toDateKey(addMonths(new Date(2026, 11, 1), 1))).toBe('2027-01-01')
    expect(toDateKey(addMonths(new Date(2026, 0, 1), -1))).toBe('2025-12-01')
  })

  it('compara dias independentemente do horario', () => {
    expect(isSameDay(new Date(2026, 9, 22, 1), new Date(2026, 9, 22, 23))).toBe(true)
    expect(isSameDay(new Date(2026, 9, 22), new Date(2026, 9, 23))).toBe(false)
  })

  it('identifica evento de dia inteiro apenas sem horario e sem termino', () => {
    const midnight = combineDateTime('2026-10-22', '').toISOString()
    const timed = combineDateTime('2026-10-22', '09:00').toISOString()
    expect(isAllDayEvent({ start_at: midnight, end_at: null })).toBe(true)
    expect(isAllDayEvent({ start_at: timed, end_at: null })).toBe(false)
    expect(isAllDayEvent({ start_at: midnight, end_at: timed })).toBe(false)
  })
})
