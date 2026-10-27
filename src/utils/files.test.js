import { describe, expect, it } from 'vitest'
import {
  MAX_FILE_SIZE,
  formatBytes,
  getExtension,
  getFileType,
  sanitizeFileName,
  slugify,
  validateFile,
  validateRename
} from './files.js'

const makeFile = (parts, name) => new File(parts, name)

describe('nomes e extensoes', () => {
  it('extrai a extensao em minusculas', () => {
    expect(getExtension('App.JSX')).toBe('jsx')
    expect(getExtension('arquivo')).toBe('')
    expect(getExtension('.env')).toBe('')
    expect(getExtension('termina.')).toBe('')
  })

  it('identifica o tipo do arquivo', () => {
    expect(getFileType('a.py').language).toBe('python')
    expect(getFileType('manual.pdf').kind).toBe('binary')
    expect(getFileType('Dockerfile').label).toBe('Dockerfile')
    expect(getFileType('.env.example').label).toBe('Environment Example')
    expect(getFileType('foto.webp').kind).toBe('image')
    expect(getFileType('programa.exe')).toBeNull()
  })

  it('gera nomes de armazenamento seguros', () => {
    expect(sanitizeFileName('Relatório Final (v2).js')).toBe('Relatorio-Final-v2.js')
    expect(sanitizeFileName('../../etc/passwd')).toBe('etcpasswd')
    expect(sanitizeFileName('???')).toBe('arquivo')
    expect(sanitizeFileName('a'.repeat(300) + '.js').length).toBeLessThanOrEqual(100)
  })

  it('gera slugs validos para a restricao do banco', () => {
    const pattern = /^[a-z0-9]+(-[a-z0-9]+)*$/
    for (const name of ['Node.js & Express', 'Programação Funcional', '###', '  C++  ']) {
      expect(slugify(name)).toMatch(pattern)
    }
    expect(slugify('Node.js & Express')).toBe('node-js-express')
  })

  it('formata tamanhos', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2,0 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5,0 MB')
  })
})

describe('validacao de renomeacao', () => {
  it('exige o mesmo tipo de arquivo e extensao permitida', () => {
    expect(validateRename('a.js', 'b.ts')).toBe('')
    expect(validateRename('a.js', 'b.pdf')).not.toBe('')
    expect(validateRename('a.js', 'b.exe')).not.toBe('')
    expect(validateRename('a.js', '   ')).not.toBe('')
    expect(validateRename('a.js', 'pasta/b.js')).not.toBe('')
  })
})

describe('validacao de upload', () => {
  it('aceita codigo de texto valido', async () => {
    expect(await validateFile(makeFile(['const a = 1'], 'a.js'))).toBe('')
  })

  it('rejeita extensao nao permitida', async () => {
    expect(await validateFile(makeFile(['x'], 'virus.exe'))).toBe('Extensão não permitida.')
  })

  it('rejeita arquivo vazio', async () => {
    expect(await validateFile(makeFile([], 'vazio.js'))).toBe('O arquivo está vazio.')
  })

  it('rejeita arquivo acima do limite', async () => {
    const big = makeFile([new Uint8Array(MAX_FILE_SIZE + 1)], 'grande.txt')
    expect(await validateFile(big)).toMatch(/excede o limite/)
  })

  it('rejeita binario disfarcado de texto', async () => {
    expect(await validateFile(makeFile([new Uint8Array([1, 0, 2])], 'falso.js'))).toMatch(/texto/)
  })

  it('confere a assinatura de PDF, ZIP e DOC', async () => {
    expect(await validateFile(makeFile(['texto qualquer'], 'a.pdf'))).toMatch(/PDF/)
    expect(await validateFile(makeFile(['%PDF-1.7 conteudo'], 'a.pdf'))).toBe('')
    expect(await validateFile(makeFile(['nao e zip'], 'a.zip'))).not.toBe('')
    expect(await validateFile(makeFile([new Uint8Array([0x50, 0x4b, 3, 4])], 'a.zip'))).toBe('')
    expect(await validateFile(makeFile([new Uint8Array([0xd0, 0xcf, 0x11, 0xe0])], 'a.doc'))).toBe('')
  })

  it('valida as assinaturas dos formatos de imagem aceitos', async () => {
    expect(await validateFile(makeFile([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'a.png'))).toBe('')
    expect(await validateFile(makeFile([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], 'a.jpeg'))).toBe('')
    expect(await validateFile(makeFile(['conteudo falso'], 'a.png'))).toMatch(/imagem/)
  })

  it('aceita SVG local seguro e rejeita SVG ativo ou com referencia externa', async () => {
    expect(await validateFile(makeFile(['<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg>'], 'a.svg'))).toBe('')
    expect(await validateFile(makeFile(['<svg><script>alert(1)</script></svg>'], 'a.svg'))).toMatch(/SVG/)
    expect(await validateFile(makeFile(['<svg><image href="https://example.com/a.png" /></svg>'], 'a.svg'))).toMatch(/SVG/)
  })

  it('valida formatos Office e OpenDocument compactados', async () => {
    const zipHeader = new Uint8Array([0x50, 0x4b, 0x03, 0x04])
    expect(await validateFile(makeFile([zipHeader], 'slides.pptx'))).toBe('')
    expect(await validateFile(makeFile([zipHeader], 'workbook.xlsx'))).toBe('')
    expect(await validateFile(makeFile(['texto falso'], 'slides.pptx'))).not.toBe('')
  })
})
