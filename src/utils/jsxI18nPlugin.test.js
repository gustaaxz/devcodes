import { describe, expect, it } from 'vitest'
import { transformSync } from '@babel/core'
import { jsxI18nPlugin } from './jsxI18nPlugin.js'

describe('jsxI18nPlugin', () => {
  it('wraps JSX text, visible conditional branches, and accessible labels', () => {
    const result = transformSync("const View = ({ busy }) => <button aria-label={busy ? 'Salvando' : 'Salvar'} title=\"Ajuda\">{busy ? 'Carregando' : 'Pronto'}</button>", {
      babelrc: false,
      configFile: false,
      parserOpts: { sourceType: 'module', plugins: ['jsx'] },
      plugins: [jsxI18nPlugin]
    })

    expect(result.code).toContain("from \"@devcodes/LocalizedText\"")
    expect(result.code).toContain('__DevCodesAttributeText("Ajuda")')
    expect(result.code).toContain('__DevCodesAttributeText("Salvando")')
    expect(result.code).toContain('value="Carregando"')
    expect(result.code).toContain('value="Pronto"')
  })

  it('does not add runtime imports when a file has no visible text', () => {
    const result = transformSync('const Icon = () => <svg aria-hidden="true" />', {
      babelrc: false,
      configFile: false,
      parserOpts: { sourceType: 'module', plugins: ['jsx'] },
      plugins: [jsxI18nPlugin]
    })

    expect(result.code).not.toContain('@devcodes/LocalizedText')
  })
})
