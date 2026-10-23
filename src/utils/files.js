export const FILES_BUCKET = 'programming-files'
export const MAX_FILE_SIZE = 10 * 1024 * 1024
export const MAX_VIEW_SIZE = 512 * 1024
export const MAX_HIGHLIGHT_SIZE = 200 * 1024

export const FILE_TYPES = {
  js: { kind: 'text', label: 'JavaScript', language: 'javascript', mime: 'text/javascript' },
  mjs: { kind: 'text', label: 'JavaScript', language: 'javascript', mime: 'text/javascript' },
  cjs: { kind: 'text', label: 'JavaScript', language: 'javascript', mime: 'text/javascript' },
  jsx: { kind: 'text', label: 'React (JSX)', language: 'jsx', mime: 'text/jsx' },
  ts: { kind: 'text', label: 'TypeScript', language: 'typescript', mime: 'text/typescript' },
  tsx: { kind: 'text', label: 'React (TSX)', language: 'tsx', mime: 'text/tsx' },
  html: { kind: 'text', label: 'HTML', language: 'markup', mime: 'text/html' },
  htm: { kind: 'text', label: 'HTML', language: 'markup', mime: 'text/html' },
  xml: { kind: 'text', label: 'XML', language: 'markup', mime: 'application/xml' },
  css: { kind: 'text', label: 'CSS', language: 'css', mime: 'text/css' },
  scss: { kind: 'text', label: 'SCSS', language: 'scss', mime: 'text/x-scss' },
  json: { kind: 'text', label: 'JSON', language: 'json', mime: 'application/json' },
  md: { kind: 'text', label: 'Markdown', language: 'markdown', mime: 'text/markdown' },
  txt: { kind: 'text', label: 'Texto', language: null, mime: 'text/plain' },
  java: { kind: 'text', label: 'Java', language: 'java', mime: 'text/x-java-source' },
  py: { kind: 'text', label: 'Python', language: 'python', mime: 'text/x-python' },
  sql: { kind: 'text', label: 'SQL', language: 'sql', mime: 'application/sql' },
  sh: { kind: 'text', label: 'Shell', language: 'bash', mime: 'text/x-shellscript' },
  yml: { kind: 'text', label: 'YAML', language: 'yaml', mime: 'application/yaml' },
  yaml: { kind: 'text', label: 'YAML', language: 'yaml', mime: 'application/yaml' },
  c: { kind: 'text', label: 'C', language: 'c', mime: 'text/x-c' },
  h: { kind: 'text', label: 'C', language: 'c', mime: 'text/x-c' },
  cpp: { kind: 'text', label: 'C++', language: 'cpp', mime: 'text/x-c++' },
  cs: { kind: 'text', label: 'C#', language: 'csharp', mime: 'text/x-csharp' },
  go: { kind: 'text', label: 'Go', language: 'go', mime: 'text/x-go' },
  rs: { kind: 'text', label: 'Rust', language: 'rust', mime: 'text/x-rust' },
  php: { kind: 'text', label: 'PHP', language: 'php', mime: 'application/x-httpd-php' },
  rb: { kind: 'text', label: 'Ruby', language: 'ruby', mime: 'text/x-ruby' },
  kt: { kind: 'text', label: 'Kotlin', language: 'kotlin', mime: 'text/x-kotlin' },
  pdf: { kind: 'binary', label: 'PDF', language: null, mime: 'application/pdf' },
  doc: { kind: 'binary', label: 'Word', language: null, mime: 'application/msword' },
  docx: {
    kind: 'binary',
    label: 'Word',
    language: null,
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  },
  zip: { kind: 'binary', label: 'ZIP', language: null, mime: 'application/zip' }
}

export const ACCEPTED_EXTENSIONS = Object.keys(FILE_TYPES)
export const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.map((extension) => `.${extension}`).join(',')

export function getExtension(name) {
  const index = name.lastIndexOf('.')
  if (index <= 0 || index === name.length - 1) return ''
  return name.slice(index + 1).toLowerCase()
}

export function getFileType(nameOrExtension) {
  const extension = nameOrExtension.includes('.') ? getExtension(nameOrExtension) : nameOrExtension.toLowerCase()
  return FILE_TYPES[extension] || null
}

export function isTextFile(file) {
  const type = getFileType(file.extension || file.original_name)
  return Boolean(type) && type.kind === 'text'
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

export function slugify(value) {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'categoria'
}

export function sanitizeFileName(name) {
  const cleaned = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9._-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^[.-]+/, '')
    .slice(-100)
  return cleaned || 'arquivo'
}

function startsWith(bytes, signature) {
  return signature.every((value, index) => bytes[index] === value)
}

export async function validateFile(file) {
  const extension = getExtension(file.name)
  const type = FILE_TYPES[extension]
  if (!type) return 'Extensão não permitida.'
  if (file.size === 0) return 'O arquivo está vazio.'
  if (file.size > MAX_FILE_SIZE) return `O arquivo excede o limite de ${formatBytes(MAX_FILE_SIZE)}.`

  const head = new Uint8Array(await file.slice(0, 8192).arrayBuffer())

  if (type.kind === 'text' && head.includes(0)) {
    return 'O conteúdo não corresponde a um arquivo de texto.'
  }
  if (extension === 'pdf' && !startsWith(head, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    return 'O conteúdo não corresponde a um PDF válido.'
  }
  if ((extension === 'zip' || extension === 'docx') && !startsWith(head, [0x50, 0x4b])) {
    return 'O conteúdo não corresponde ao formato do arquivo.'
  }
  if (extension === 'doc' && !startsWith(head, [0xd0, 0xcf, 0x11, 0xe0])) {
    return 'O conteúdo não corresponde ao formato do arquivo.'
  }
  return ''
}

export function validateRename(currentName, nextName) {
  const trimmed = nextName.trim()
  if (!trimmed) return 'Informe o nome do arquivo.'
  if (trimmed.length > 255) return 'O nome do arquivo é muito longo.'
  if (/[\\/]/.test(trimmed)) return 'O nome não pode conter barras.'
  const nextType = getFileType(trimmed)
  const currentType = getFileType(currentName)
  if (!nextType) return 'Extensão não permitida.'
  if (currentType && nextType.kind !== currentType.kind) {
    return 'A nova extensão deve ser do mesmo tipo de arquivo.'
  }
  return ''
}
