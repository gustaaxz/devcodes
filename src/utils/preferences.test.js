import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES, mergePreferences, normalizePreferences } from './preferences.js'

describe('preferencias', () => {
  it('usa os padroes para valores ausentes ou invalidos', () => {
    expect(normalizePreferences(null)).toEqual(DEFAULT_PREFERENCES)
    expect(normalizePreferences('texto')).toEqual(DEFAULT_PREFERENCES)
    expect(
      normalizePreferences({ theme: 'neon', calendar: { weekStart: 9 }, library: { layout: 'x', sort: 'y' } })
    ).toEqual(DEFAULT_PREFERENCES)
  })

  it('preserva valores validos', () => {
    const result = normalizePreferences({ theme: 'light', calendar: { weekStart: 1 }, library: { layout: 'grid', sort: 'name' } })
    expect(result).toEqual({ theme: 'light', calendar: { weekStart: 1 }, library: { layout: 'grid', sort: 'name' } })
  })

  it('mescla alteracoes parciais sem perder o restante', () => {
    const merged = mergePreferences(DEFAULT_PREFERENCES, { library: { layout: 'grid' } })
    expect(merged.library).toEqual({ layout: 'grid', sort: 'recent' })
    expect(merged.theme).toBe('dark')
    expect(merged.calendar.weekStart).toBe(0)
  })
})
