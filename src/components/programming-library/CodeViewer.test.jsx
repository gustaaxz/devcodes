import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import CodeViewer from './CodeViewer.jsx'

const render = (props) => renderToStaticMarkup(<CodeViewer {...props} />)

describe('visualizador de codigo', () => {
  it('numera as linhas e realca a sintaxe', () => {
    const html = render({ code: 'const a = 1\nreturn a', language: 'javascript', highlight: true })
    expect(html).toContain('1\n2')
    expect(html).toContain('class="token keyword"')
  })

  it('realca linguagens adicionais', () => {
    for (const [language, code] of [['java', 'public class A {}'], ['python', 'def f(): pass'], ['sql', 'SELECT 1;'], ['tsx', 'const a = <div />']]) {
      expect(render({ code, language, highlight: true })).toContain('class="token')
    }
  })

  it('escapa conteudo malicioso mesmo com realce', () => {
    const html = render({ code: 'const a = "<script>alert(1)</script>"', language: 'javascript', highlight: true })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('nao realca quando desativado ou sem linguagem', () => {
    expect(render({ code: 'const a = 1', language: 'javascript', highlight: false })).not.toContain('class="token')
    expect(render({ code: 'texto', language: null, highlight: true })).not.toContain('class="token')
  })
})
