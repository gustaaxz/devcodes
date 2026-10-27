import { describe, expect, it } from 'vitest'
import { mapBackupSnapshotForImport } from './backupUtils.js'
import { parseImportData } from '../import/importData.js'

describe('mapBackupSnapshotForImport', () => {
  it('converts records, category names and note/task tags while dropping backup IDs', () => {
    const snapshot = {
      format: 'devcodes-backup',
      version: 2,
      exported_at: '2026-10-27T12:00:00.000Z',
      data: {
        categories: [{ id: 'cat-1', name: 'Estudo' }],
        tags: [{ id: 'tag-1', name: 'React' }],
        notes: [{ id: 'note-1', title: 'Hooks', content: 'useState', category_id: 'cat-1' }],
        tasks: [{ id: 'task-1', title: 'Revisar', status: 'pending', category_id: 'cat-1' }],
        events: [{ id: 'event-1', title: 'Aula', start_at: '2026-10-27T13:00:00Z', category_id: 'cat-1' }],
        note_tags: [{ note_id: 'note-1', tag_id: 'tag-1' }],
        task_tags: [{ task_id: 'task-1', tag_id: 'tag-1' }]
      }
    }

    const portable = mapBackupSnapshotForImport(snapshot)
    const result = parseImportData(JSON.stringify(portable), 'backup.json')
    expect(portable.version).toBe(1)
    expect(result.records.notes[0]).toMatchObject({ title: 'Hooks', category_name: 'Estudo', tags: ['React'] })
    expect(result.records.tasks[0]).toMatchObject({ title: 'Revisar', category_name: 'Estudo', tags: ['React'] })
    expect(result.records.events[0]).toMatchObject({ title: 'Aula', category_name: 'Estudo' })
    expect(result.records.notes[0]).not.toHaveProperty('id')
  })

  it('rejects unsupported backup formats', () => {
    expect(() => mapBackupSnapshotForImport({ format: 'other', version: 2, data: {} })).toThrow(/formato/)
  })
})
