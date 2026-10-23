import { describe, expect, it } from 'vitest'
import { countResults, sanitizeTerm } from './searchService.js'

describe('pesquisa global', () => {
  it('remove caracteres que alteram o filtro do PostgREST ou o padrao ilike', () => {
    expect(sanitizeTerm('a,b(c)"d"%_*  e')).toBe('a b c d e')
    expect(sanitizeTerm('  prova de calculo  ')).toBe('prova de calculo')
    expect(sanitizeTerm('%%%')).toBe('')
  })

  it('conta resultados de todos os tipos', () => {
    expect(countResults({ notes: [1, 2], tasks: [], files: [3] })).toBe(3)
    expect(countResults({ notes: [] })).toBe(0)
  })
})
