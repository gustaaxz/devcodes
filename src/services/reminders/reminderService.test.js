import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../supabase/client.js'
import { calculateRemindAt, getOffsetLabel, markReminderNotified } from './reminderService.js'

vi.mock('../supabase/client.js', () => ({ supabase: { from: vi.fn() } }))

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

describe('delivery de lembretes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('marca como notificado somente se o horário do lembrete não mudou durante a ação', async () => {
    const query = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
    }
    supabase.from.mockReturnValue(query)

    await markReminderNotified('reminder-1', 'user-1', '2026-10-28T12:00:00.000Z')

    expect(query.eq).toHaveBeenCalledWith('remind_at', '2026-10-28T12:00:00.000Z')
  })
})
