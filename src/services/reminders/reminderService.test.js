import { describe, expect, it } from 'vitest'
import { calculateRemindAt, getOffsetLabel } from './reminderService.js'

describe('reminderService date helpers', () => {
  it('calculates the notification time from the task deadline and offset', () => {
    expect(calculateRemindAt('2026-10-27T12:00:00.000Z', 30)).toBe('2026-10-27T11:30:00.000Z')
  })

  it('returns null when a task has no deadline', () => {
    expect(calculateRemindAt(null, 15)).toBeNull()
  })

  it('rejects invalid dates and negative offsets', () => {
    expect(() => calculateRemindAt('invalid-date', 15)).toThrow('Data ou antecedência do lembrete inválida.')
    expect(() => calculateRemindAt('2026-10-27T12:00:00.000Z', -1)).toThrow('Data ou antecedência do lembrete inválida.')
  })

  it('formats known and custom offsets', () => {
    expect(getOffsetLabel(15)).toBe('15 minutos antes')
    expect(getOffsetLabel(45)).toBe('45m antes')
    expect(getOffsetLabel(180)).toBe('3h antes')
  })
})
