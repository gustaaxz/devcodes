export const FILES_BUCKET = 'programming-files'
export const MAX_FILE_SIZE = 10 * 1024 * 1024
export const MAX_VIEW_SIZE = 512 * 1024
export const MAX_PREVIEW_SIZE = MAX_FILE_SIZE
export const MAX_HIGHLIGHT_SIZE = 200 * 1024

const textType = (label, language, mime = 'text/plain') => ({ kind: 'text', label, language, mime })
const binaryType = (label, mime = 'application/octet-stream') => ({ kind: 'binary', label, language: null, mime })
const imageType = (label, mime) => ({ kind: 'image', label, language: null, mime })

export const FILE_TYPES = {
  js: textType('JavaScript', 'javascript', 'text/javascript'),
  mjs: textType('JavaScript', 'javascript', 'text/javascript'),
  cjs: textType('JavaScript', 'javascript', 'text/javascript'),
  jsx: textType('React (JSX)', 'jsx', 'text/jsx'),
  ts: textType('TypeScript', 'typescript', 'text/typescript'),
  tsx: textType('React (TSX)', 'tsx', 'text/tsx'),
  html: textType('HTML', 'markup', 'text/html'),
  htm: textType('HTML', 'markup', 'text/html'),
  xml: textType('XML', 'markup', 'application/xml'),
  css: textType('CSS', 'css', 'text/css'),
  scss: textType('SCSS', 'scss', 'text/x-scss'),
  json: textType('JSON', 'json', 'application/json'),
  md: textType('Markdown', 'markdown', 'text/markdown'),
  txt: textType('Texto', null),
  java: textType('Java', 'java', 'text/x-java-source'),
  py: textType('Python', 'python', 'text/x-python'),
  sql: textType('SQL', 'sql', 'application/sql'),
  sh: textType('Shell', 'bash', 'text/x-shellscript'),
  yml: textType('YAML', 'yaml', 'application/yaml'),
  yaml: textType('YAML', 'yaml', 'application/yaml'),
  c: textType('C', 'c', 'text/x-c'),
  h: textType('C', 'c', 'text/x-c'),
  cpp: textType('C++', 'cpp', 'text/x-c++'),
  cs: textType('C#', 'csharp', 'text/x-csharp'),
  go: textType('Go', 'go', 'text/x-go'),
  rs: textType('Rust', 'rust', 'text/x-rust'),
  php: textType('PHP', 'php', 'application/x-httpd-php'),
  rb: textType('Ruby', 'ruby', 'text/x-ruby'),
  kt: textType('Kotlin', 'kotlin', 'text/x-kotlin'),
  vue: textType('Vue', 'markup'),
  svelte: textType('Svelte', 'markup'),
  swift: textType('Swift', 'swift'),
  dart: textType('Dart', 'dart'),
  ipynb: textType('Jupyter Notebook', 'json', 'application/json'),
  toml: textType('TOML', 'ini'),
  ini: textType('INI', 'ini'),
  conf: textType('Configuração', 'ini'),
  tf: textType('Terraform', 'hcl'),
  hcl: textType('HCL', 'hcl'),
  gradle: textType('Gradle', 'groovy'),
  properties: textType('Properties', 'ini'),
  csv: textType('CSV', null, 'text/csv'),
  log: textType('Log', null),
  rst: textType('reStructuredText', 'markdown'),
  adoc: textType('AsciiDoc', 'markdown'),
  pdf: binaryType('PDF', 'application/pdf'),
  doc: binaryType('Word', 'application/msword'),
  docx: binaryType('Word', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
  ppt: binaryType('PowerPoint', 'application/vnd.ms-powerpoint'),
  pptx: binaryType('PowerPoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'),
  xls: binaryType('Excel', 'application/vnd.ms-excel'),
  xlsx: binaryType('Excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
  odt: binaryType('OpenDocument Text', 'application/vnd.oasis.opendocument.text'),
  ods: binaryType('OpenDocument Spreadsheet', 'application/vnd.oasis.opendocument.spreadsheet'),
  odp: binaryType('OpenDocument Presentation', 'application/vnd.oasis.opendocument.presentation'),
  rtf: binaryType('Rich Text Format', 'application/rtf'),
  zip: binaryType('ZIP', 'application/zip'),
  png: imageType('PNG', 'image/png'),
  jpg: imageType('JPEG', 'image/jpeg'),
  jpeg: imageType('JPEG', 'image/jpeg'),
  webp: imageType('WebP', 'image/webp'),
  svg: imageType('SVG', 'image/svg+xml'),
  gif: imageType('GIF', 'image/gif'),
  bmp: imageType('Bitmap', 'image/bmp'),
  avif: imageType('AVIF', 'image/avif')
}

const SPECIAL_FILE_TYPES = {
  dockerfile: textType('Dockerfile', 'docker'),
  '.gitignore': textType('Git Ignore', 'git'),
  '.dockerignore': textType('Docker Ignore', 'git'),
  '.editorconfig': textType('EditorConfig', 'ini'),
  '.env.example': textType('Environment Example', 'bash')
}

export const ACCEPTED_EXTENSIONS = Object.keys(FILE_TYPES)
export const ACCEPT_ATTRIBUTE = [...ACCEPTED_EXTENSIONS.map((extension) => `.${extension}`), 'text/plain', ...Object.keys(SPECIAL_FILE_TYPES)].join(',')

export function getExtension(name) {
  const normalized = name.toLowerCase()
  if (['.gitignore', '.dockerignore', '.editorconfig', '.env.example'].includes(normalized)) return normalized
  const index = name.lastIndexOf('.')
  if (index <= 0 || index === name.length - 1) return ''
  return name.slice(index + 1).toLowerCase()
}

export function getFileType(nameOrExtension) {
  const normalized = nameOrExtension.toLowerCase()
  if (SPECIAL_FILE_TYPES[normalized]) return SPECIAL_FILE_TYPES[normalized]
  const extension = nameOrExtension.includes('.') ? getExtension(nameOrExtension) : normalized
  return FILE_TYPES[extension] || null
}

export function isTextFile(file) {
  const type = getFileType(file.extension || file.original_name)
  return Boolean(type) && type.kind === 'text'
}

export function isPreviewableFile(file) {
  const type = getFileType(file.extension || file.original_name)
  return type?.kind === 'image' || type?.mime === 'application/pdf'
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

function isZipFile(bytes) {
  return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) || startsWith(bytes, [0x50, 0x4b, 0x05, 0x06])
}

function isSafeSvg(source) {
  if (!/<svg(?:\s|>)/i.test(source) || /<(?:script|foreignObject|iframe|object|embed)\b/i.test(source)) return false
  if (/\son[a-z]+\s*=/i.test(source) || /<!DOCTYPE|<!ENTITY|@import/i.test(source)) return false

  const references = source.matchAll(/(?:href|src)\s*=\s*(["'])(.*?)\1/gi)
  for (const [, , value] of references) {
    if (!value.startsWith('#')) return false
  }

  const cssUrls = source.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)
  for (const [, , value] of cssUrls) {
    if (!value.startsWith('#')) return false
  }
  return true
}

function hasImageSignature(extension, bytes) {
  if (extension === 'png') return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (extension === 'jpg' || extension === 'jpeg') return startsWith(bytes, [0xff, 0xd8, 0xff])
  if (extension === 'gif') return startsWith(bytes, [0x47, 0x49, 0x46, 0x38])
  if (extension === 'bmp') return startsWith(bytes, [0x42, 0x4d])
  if (extension === 'webp') return startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  if (extension === 'avif') return String.fromCharCode(...bytes.slice(4, 12)).includes('ftypavif')
  return false
}

export async function validateFile(file) {
  const name = file.name.toLowerCase()
  const extension = getExtension(name)
  const type = getFileType(name)
  if (!type) return 'Extensão não permitida.'
  if (file.size === 0) return 'O arquivo está vazio.'
  if (file.size > MAX_FILE_SIZE) return `O arquivo excede o limite de ${formatBytes(MAX_FILE_SIZE)}.`

  const head = new Uint8Array(await file.slice(0, 8192).arrayBuffer())
  if ((type.kind === 'text' || extension === 'svg') && head.includes(0)) {
    return 'O conteúdo não corresponde a um arquivo de texto.'
  }
  if (type.kind === 'image' && extension !== 'svg' && !hasImageSignature(extension, head)) {
    return 'O conteúdo não corresponde a uma imagem válida.'
  }
  if (extension === 'svg' && !isSafeSvg(await file.text())) {
    return 'O SVG contém elementos não permitidos ou está inválido.'
  }
  if (extension === 'pdf' && !startsWith(head, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    return 'O conteúdo não corresponde a um PDF válido.'
  }
  if (['zip', 'docx', 'pptx', 'xlsx', 'odt', 'ods', 'odp'].includes(extension) && !isZipFile(head)) {
    return 'O conteúdo não corresponde ao formato do arquivo.'
  }
  if (['doc', 'ppt', 'xls'].includes(extension) && !startsWith(head, [0xd0, 0xcf, 0x11, 0xe0])) {
    return 'O conteúdo não corresponde ao formato do arquivo.'
  }
  if (extension === 'rtf' && !startsWith(head, [0x7b, 0x5c, 0x72, 0x74, 0x66])) {
    return 'O conteúdo não corresponde ao formato do arquivo.'
  }
  if (extension === 'ipynb') {
    try {
      JSON.parse(await file.text())
    } catch {
      return 'O conteúdo não corresponde a um notebook JSON válido.'
    }
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
