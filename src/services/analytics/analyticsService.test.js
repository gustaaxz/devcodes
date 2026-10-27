import { describe, expect, it } from 'vitest'
import { buildAnalytics } from './analyticsService.js'

describe('buildAnalytics', () => {
  it('aggregates activity, completion rate and category totals for the selected range', () => {
    const now = new Date('2026-10-27T12:00:00.000Z')
    const result = buildAnalytics({
      now,
      days: 3,
      tasks: [
        { status: 'done', completed_at: '2026-10-27T10:00:00.000Z', category_id: 'cat-1' },
        { status: 'done', completed_at: '2026-10-26T10:00:00.000Z', category_id: 'cat-1' },
        { status: 'pending', completed_at: null, category_id: null }
      ],
      notes: [{ created_at: '2026-10-27T09:00:00.000Z' }],
      files: [{ created_at: '2026-10-25T09:00:00.000Z' }],
      categories: [{ id: 'cat-1', name: 'Estudo', color: '#123456' }]
    })

    expect(result.completedTasks).toBe(2)
    expect(result.pendingTasks).toBe(1)
    expect(result.completionRate).toBe(67)
    expect(result.activeDays).toBe(3)
    expect(result.currentStreak).toBe(3)
    expect(result.bestStreak).toBe(3)
    expect(result.weeklyChangePercent).toBe(100)
    expect(result.mostActiveWeekday).toBe('terça-feira')
    expect(result.categories).toEqual([{ name: 'Estudo', color: '#123456', value: 2 }])
    expect(result.points.reduce((total, point) => total + point.tasks + point.notes + point.files, 0)).toBe(4)
  })

  it('uses English labels and date formatting when the locale is en-US', () => {
    const result = buildAnalytics({
      locale: 'en-US',
      now: new Date('2026-10-27T12:00:00.000Z'),
      days: 1,
      tasks: [{ status: 'done', completed_at: '2026-10-27T10:00:00.000Z', category_id: 'missing' }]
    })

    expect(result.points[0].label).toContain('10/27')
    expect(result.mostActiveWeekday).toBe('Tuesday')
    expect(result.categories[0].name).toBe('Uncategorized')
  })
})
