import { describe, expect, it } from 'vitest'
import { hasTranslation, translate, translateText } from './i18n.js'

describe('traduções da navegação', () => {
  it('seleciona o idioma e substitui parâmetros', () => {
    expect(translate('en-US', 'tour.progress', { current: 2, total: 5 })).toBe('Step 2 of 5')
    expect(translate('pt-BR', 'nav.tasks')).toBe('Tarefas')
  })

  it('usa português como fallback para mensagens ainda não traduzidas', () => {
    expect(translate('en-US', 'nav.settings')).toBe('Settings')
    expect(translate('en-US', 'missing.key')).toBe('missing.key')
  })

  it('traduz mensagens com parâmetros e preserva espaços ao redor', () => {
    expect(translate('en-US', 'search.detail.note', { date: '10/27/2026' })).toBe('Note · 10/27/2026')
    expect(translateText('en-US', '  Buscar arquivos  ')).toBe('  Search files  ')
    expect(hasTranslation('en-US', 'Análise de produtividade')).toBe(true)
  })
})
