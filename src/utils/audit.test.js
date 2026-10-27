import { describe, expect, it } from 'vitest'
import { getAuditLabels } from './audit.js'

describe('rótulos de auditoria', () => {
  it('traduz recurso, operação e campos registrados', () => {
    expect(getAuditLabels({ entity_type: 'tasks', operation: 'UPDATE', changed_fields: ['title', 'due_at'] }, 'en-US'))
      .toEqual({ operation: 'Updated', entity: 'Tasks', fields: ['Title', 'Due date'] })
  })
})
