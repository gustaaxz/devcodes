import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import MarkdownPreview from './MarkdownPreview.jsx'

const render = (content) => renderToStaticMarkup(<MarkdownPreview content={content} />)

describe('visualizacao de anotacoes', () => {
  it('renderiza titulos, negrito, italico e listas', () => {
    const html = render('# Titulo\n\nTexto **forte** e *leve*\n\n- a\n- b\n\n1. um\n2. dois')
    expect(html).toContain('<h1>Titulo</h1>')
    expect(html).toContain('<strong>forte</strong>')
    expect(html).toContain('<em>leve</em>')
    expect(html).toContain('<ul><li>a</li><li>b</li></ul>')
    expect(html).toContain('<ol><li>um</li><li>dois</li></ol>')
  })

  it('escapa HTML digitado pelo usuario', () => {
    const html = render('<script>alert(1)</script> <img src=x onerror=alert(1)>')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;script&gt;')
  })

  it('mostra aviso quando nao ha conteudo', () => {
    expect(render('   ')).toContain('Nada para visualizar.')
  })
})
