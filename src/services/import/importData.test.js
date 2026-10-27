import { describe, expect, it } from 'vitest'
import { BACKUP_FORMAT, parseImportData } from './importData.js'

describe('parseImportData', () => {
  it('validates a portable DevCodes backup and only keeps supported fields', () => {
    const payload = {
      format: BACKUP_FORMAT,
      version: 1,
      data: {
        notes: [{
          id: 'foreign-id',
          user_id: 'another-user',
          title: 'Nota',
          content: '# Conteúdo',
          category: 'Estudos',
          tags: ['React'],
          created_at: '2026-10-27T10:00:00.000Z'
        }],
        tasks: [{ title: 'Revisar', status: 'in_progress', priority: 'high', due_at: '2026-10-28T12:00:00.000Z' }],
        events: [{ title: 'Aula', start_at: '2026-10-29T10:00:00.000Z', end_at: '2026-10-29T11:00:00.000Z' }]
      }
    }

    const result = parseImportData(JSON.stringify(payload), 'devcodes-backup.json')

    expect(result.validCount).toBe(3)
    expect(result.errors).toEqual([])
    expect(result.records.notes[0]).toMatchObject({ title: 'Nota', category_name: 'Estudos', tags: ['React'] })
    expect(result.records.notes[0]).not.toHaveProperty('id')
    expect(result.records.notes[0]).not.toHaveProperty('user_id')
    expect(result.records.tasks[0].status).toBe('in_progress')
  })

  it('imports the existing task CSV format and parses escaped quotes and commas', () => {
    const csv = 'title,status,priority,due_at,created_at\r\n"Revisar, capítulo ""3""",pending,medium,2026-10-28T12:00:00.000Z,2026-10-27T10:00:00.000Z'
    const result = parseImportData(csv, 'tasks-123.csv')

    expect(result.validCount).toBe(1)
    expect(result.records.tasks[0].title).toBe('Revisar, capítulo "3"')
  })

  it('supports commas and line breaks inside quoted note content', () => {
    const csv = 'title,content\nNota,"linha um,\nlinha dois"'
    const result = parseImportData(csv, 'notes-123.csv')

    expect(result.records.notes[0].content).toBe('linha um,\nlinha dois')
  })

  it('reports invalid rows without blocking valid records', () => {
    const backup = {
      format: BACKUP_FORMAT,
      version: 1,
      data: { tasks: [{ title: 'Válida' }, { title: 'Inválida', status: 'started' }] }
    }
    const result = parseImportData(JSON.stringify(backup), 'backup.json')

    expect(result.validCount).toBe(1)
    expect(result.errors).toEqual([{ dataset: 'tasks', row: 2, message: 'Status de tarefa inválido.' }])
  })

  it('rejects unsupported backup versions and invalid event intervals', () => {
    expect(() => parseImportData(JSON.stringify({ format: BACKUP_FORMAT, version: 2, data: {} }))).toThrow('Versão ou conteúdo do backup DevCodes não suportado.')

    const backup = {
      format: BACKUP_FORMAT,
      version: 1,
      data: { events: [{ title: 'Evento', start_at: '2026-10-29T12:00:00.000Z', end_at: '2026-10-29T11:00:00.000Z' }] }
    }
    const result = parseImportData(JSON.stringify(backup))
    expect(result.validCount).toBe(0)
    expect(result.errors[0].message).toBe('O término não pode ocorrer antes do início.')
  })
})
