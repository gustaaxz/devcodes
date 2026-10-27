export const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024
export const MAX_IMPORT_ROWS = 500
export const BACKUP_FORMAT = 'devcodes-backup'
export const BACKUP_VERSION = 1

const DATASET_NAMES = ['notes', 'tasks', 'events']
const TASK_STATUSES = new Set(['pending', 'in_progress', 'done'])
const EVENT_STATUSES = new Set(['scheduled', 'completed', 'cancelled'])
const PRIORITIES = new Set(['low', 'medium', 'high'])

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function optionalText(value, maxLength, label) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') throw new Error(`${label} precisa ser texto.`)
  if (value.length > maxLength) throw new Error(`${label} excede ${maxLength} caracteres.`)
  return value
}

function requiredTitle(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Título obrigatório.')
  if (value.trim().length > 200) throw new Error('Título excede 200 caracteres.')
  return value.trim()
}

function optionalTimestamp(value, label) {
  if (value === null || value === undefined || value === '') return null
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) throw new Error(`${label} inválido.`)
  return date.toISOString()
}

function optionalDate(value, label) {
  if (value === null || value === undefined || value === '') return null
  const date = new Date(`${value}T00:00:00.000Z`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(String(value)) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== String(value)
  ) {
    throw new Error(`${label} inválida. Use AAAA-MM-DD.`)
  }
  return String(value)
}

function optionalCategory(row) {
  const value = row.category_name ?? row.category ?? row.categories?.name ?? null
  if (value === null || value === '') return null
  if (typeof value !== 'string' || value.trim().length > 60) {
    throw new Error('Categoria inválida ou acima de 60 caracteres.')
  }
  return value.trim()
}

function optionalBoolean(value, label) {
  if (value === null || value === undefined || value === '') return undefined
  if (typeof value === 'boolean') return value
  const normalized = String(value).trim().toLowerCase()
  if (['true', '1', 'sim', 'yes'].includes(normalized)) return true
  if (['false', '0', 'não', 'nao', 'no'].includes(normalized)) return false
  throw new Error(`${label} precisa ser verdadeiro ou falso.`)
}

function optionalTags(value) {
  if (value === null || value === undefined || value === '') return []
  let tags = value
  if (typeof value === 'string') {
    try {
      tags = JSON.parse(value)
    } catch {
      tags = value.split('|')
    }
  }
  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string' || tag.trim().length > 40)) {
    throw new Error('Tags precisam ser uma lista de textos com até 40 caracteres cada.')
  }
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))]
}

function normalizeRecord(type, row) {
  if (!isRecord(row)) throw new Error('O registro precisa ser um objeto.')
  const record = {
    title: requiredTitle(row.title),
    description: optionalText(row.description, 10_000, 'Descrição'),
    category_name: optionalCategory(row)
  }
  if (row.created_at) record.created_at = optionalTimestamp(row.created_at, 'Data de criação')
  if (row.updated_at) record.updated_at = optionalTimestamp(row.updated_at, 'Data de alteração')

  if (type === 'notes') {
    record.content = row.content === null || row.content === undefined ? '' : String(row.content)
    record.linked_date = optionalDate(row.linked_date, 'Data vinculada')
    record.is_favorite = optionalBoolean(row.is_favorite, 'Favorito')
    record.is_pinned = optionalBoolean(row.is_pinned, 'Fixada')
    record.tags = optionalTags(row.tags)
    delete record.description
    return record
  }

  if (type === 'tasks') {
    const status = String(row.status || 'pending').trim().toLowerCase()
    const priority = String(row.priority || 'medium').trim().toLowerCase()
    if (!TASK_STATUSES.has(status)) throw new Error('Status de tarefa inválido.')
    if (!PRIORITIES.has(priority)) throw new Error('Prioridade inválida.')
    record.status = status
    record.priority = priority
    record.due_at = optionalTimestamp(row.due_at, 'Prazo')
    record.completed_at = optionalTimestamp(row.completed_at, 'Data de conclusão')
    record.tags = optionalTags(row.tags)
    return record
  }

  if (type === 'events') {
    const status = String(row.status || 'scheduled').trim().toLowerCase()
    const priority = String(row.priority || 'medium').trim().toLowerCase()
    if (!EVENT_STATUSES.has(status)) throw new Error('Status de evento inválido.')
    if (!PRIORITIES.has(priority)) throw new Error('Prioridade inválida.')
    record.status = status
    record.priority = priority
    record.start_at = optionalTimestamp(row.start_at, 'Início')
    if (!record.start_at) throw new Error('Data de início obrigatória.')
    record.end_at = optionalTimestamp(row.end_at, 'Término')
    if (record.end_at && new Date(record.end_at) < new Date(record.start_at)) {
      throw new Error('O término não pode ocorrer antes do início.')
    }
    record.reminder_at = optionalTimestamp(row.reminder_at, 'Lembrete')
    record.ical_uid = optionalText(row.ical_uid, 255, 'UID iCalendar')
    if (record.ical_uid && /[\r\n]/.test(record.ical_uid)) throw new Error('UID iCalendar invÃ¡lido.')
    return record
  }

  throw new Error('Tipo de registro não suportado.')
}

function inferDataset(fileName, rows) {
  const name = String(fileName || '').toLowerCase()
  for (const type of DATASET_NAMES) {
    if (new RegExp(`(^|[/\\\\_-])${type}([/\\\\_.-]|$)`).test(name)) return type
  }
  const row = rows.find(isRecord)
  if (row && 'content' in row) return 'notes'
  if (row && 'start_at' in row) return 'events'
  if (row && ('due_at' in row || 'priority' in row || 'status' in row)) return 'tasks'
  return null
}

function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  const source = text.replace(/^\uFEFF/, '')

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
    } else if (char === '"') {
      if (field.length > 0) throw new Error('CSV inválido: aspas fora do início de um campo.')
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1
      row.push(field)
      if (row.some((cell) => cell !== '')) rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  if (quoted) throw new Error('CSV inválido: campo com aspas não foi fechado.')
  row.push(field)
  if (row.some((cell) => cell !== '')) rows.push(row)
  if (rows.length === 0) throw new Error('O arquivo CSV está vazio.')

  const headers = rows[0].map((header) => header.trim().toLowerCase())
  if (headers.some((header) => !header)) throw new Error('CSV inválido: existe uma coluna sem nome.')
  if (new Set(headers).size !== headers.length) throw new Error('CSV inválido: existem colunas duplicadas.')

  return rows.slice(1).map((cells, index) => {
    if (cells.length !== headers.length) throw new Error(`Linha ${index + 2}: quantidade de colunas diferente do cabeçalho.`)
    return Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex]]))
  })
}

export function parseImportData(text, fileName = '') {
  if (typeof text !== 'string' || !text.trim()) throw new Error('O arquivo está vazio.')
  if (new TextEncoder().encode(text).length > MAX_IMPORT_FILE_SIZE) throw new Error('O arquivo excede o limite de 10 MB.')

  let grouped
  if (/\.csv$/i.test(fileName)) {
    const rows = parseCSV(text)
    const type = inferDataset(fileName, rows)
    if (!type) throw new Error('Não identifiquei o tipo do CSV. Use um arquivo notes-, tasks- ou events-.csv exportado pelo DevCodes.')
    grouped = { [type]: rows }
  } else {
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Error('JSON inválido. Selecione um backup JSON ou exportação JSON do DevCodes.')
    }
    if (isRecord(parsed) && parsed.format === BACKUP_FORMAT) {
      if (parsed.version !== BACKUP_VERSION || !isRecord(parsed.data)) {
        throw new Error('Versão ou conteúdo do backup DevCodes não suportado.')
      }
      grouped = parsed.data
    } else if (Array.isArray(parsed)) {
      const type = inferDataset(fileName, parsed)
      if (!type) throw new Error('Não identifiquei o tipo desta lista JSON. Nomeie o arquivo notes-, tasks- ou events-.json.')
      grouped = { [type]: parsed }
    } else {
      throw new Error('Formato JSON não reconhecido. Use um backup completo do DevCodes.')
    }
  }

  const totalRows = DATASET_NAMES.reduce((sum, type) => sum + (Array.isArray(grouped[type]) ? grouped[type].length : 0), 0)
  if (totalRows > MAX_IMPORT_ROWS) throw new Error(`O arquivo contém ${totalRows} registros; o limite por importação é ${MAX_IMPORT_ROWS}.`)

  const records = { notes: [], tasks: [], events: [] }
  const errors = []
  for (const type of DATASET_NAMES) {
    const rows = grouped[type] ?? []
    if (!Array.isArray(rows)) {
      errors.push({ dataset: type, row: 0, message: 'A coleção precisa ser uma lista.' })
      continue
    }
    rows.forEach((row, index) => {
      try {
        records[type].push(normalizeRecord(type, row))
      } catch (error) {
        errors.push({ dataset: type, row: index + 1, message: error.message })
      }
    })
  }

  return {
    records,
    errors,
    totalRows,
    validCount: DATASET_NAMES.reduce((sum, type) => sum + records[type].length, 0),
    counts: Object.fromEntries(DATASET_NAMES.map((type) => [type, records[type].length]))
  }
}
