export function mapBackupSnapshotForImport(snapshot) {
  if (snapshot?.format !== 'devcodes-backup' || snapshot.version !== 2 || !snapshot.data) {
    throw new Error('O formato deste backup não pode ser restaurado por esta versão do aplicativo.')
  }
  const data = snapshot.data
  const categories = new Map((data.categories || []).map((category) => [category.id, category.name]))
  const tags = new Map((data.tags || []).map((tag) => [tag.id, tag.name]))
  const noteTags = new Map()
  const taskTags = new Map()
  for (const link of data.note_tags || []) noteTags.set(link.note_id, [...(noteTags.get(link.note_id) || []), tags.get(link.tag_id)].filter(Boolean))
  for (const link of data.task_tags || []) taskTags.set(link.task_id, [...(taskTags.get(link.task_id) || []), tags.get(link.tag_id)].filter(Boolean))
  return {
    format: 'devcodes-backup',
    version: 1,
    exported_at: snapshot.exported_at,
    data: {
      notes: (data.notes || []).map((note) => ({ ...note, category: categories.get(note.category_id) || null, tags: noteTags.get(note.id) || [] })),
      tasks: (data.tasks || []).map((task) => ({ ...task, category: categories.get(task.category_id) || null, tags: taskTags.get(task.id) || [] })),
      events: (data.events || []).map((event) => ({ ...event, category: categories.get(event.category_id) || null }))
    }
  }
}
