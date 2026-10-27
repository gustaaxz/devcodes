import { describe, expect, it } from 'vitest'
import { findOrphanedTagIds, normalizeTagNames, suggestTags, validateTagName } from './tagService.js'

describe('tags', () => {
  it('normaliza espaços, limita nomes e remove duplicatas sem diferenciar caixa', () => {
    expect(normalizeTagNames([' React ', 'react', ' banco   de dados ', 'x'.repeat(45)])).toEqual([
      'React',
      'banco de dados',
      'x'.repeat(40)
    ])
  })

  it('valida nome não vazio e limite máximo', () => {
    expect(validateTagName('  ')).toMatch(/nome/)
    expect(validateTagName('x'.repeat(41))).toMatch(/40/)
    expect(validateTagName(' React ')).toBe('')
  })

  it('remove apenas tags sem associações e preserva favoritas', () => {
    expect(findOrphanedTagIds(['usada', 'órfã', 'favorita'], ['usada'], ['favorita'])).toEqual(['órfã'])
  })

  it('sugere tags encontradas no conteúdo, sem repetir tags selecionadas', () => {
    const suggestions = [
      { name: 'React', color: '#3b82f6' },
      { name: 'Banco de dados' },
      { name: 'JS' },
      { name: 'Urgente' }
    ]

    expect(suggestTags(suggestions, ['react'], 'Projeto com REACT e banco de dados urgente')).toEqual([
      { name: 'Banco de dados' },
      { name: 'Urgente' }
    ])
  })
})
