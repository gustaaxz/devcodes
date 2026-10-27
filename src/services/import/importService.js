import { setNoteTags } from '../notes/notesService.js'
import { supabase } from '../supabase/client.js'
import { setResourceTags } from '../tags/tagService.js'

const BATCH_SIZE = 50
const DATASETS = ['notes', 'tasks', 'events']

async function resolveCategories(recordsByType, userId) {
  const names = [...new Set(DATASETS.flatMap((type) => recordsByType[type].map((record) => record.category_name).filter(Boolean)))]
  if (names.length === 0) return new Map()

  const { data: existing, error: existingError } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', userId)
  if (existingError) throw existingError

  const existingByName = new Map(existing.map((category) => [category.name.toLocaleLowerCase(), category.id]))
  const missingByName = new Map()
  for (const name of names) {
    if (!existingByName.has(name.toLocaleLowerCase())) missingByName.set(name.toLocaleLowerCase(), name)
  }
  const missing = [...missingByName.values()]
  if (missing.length > 0) {
    const { error } = await supabase
      .from('categories')
      .upsert(
        missing.map((name) => ({ user_id: userId, name })),
        { onConflict: 'user_id,name', ignoreDuplicates: true }
      )
    if (error) throw error
  }

  if (missing.length > 0) {
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', userId)
      .in('name', missing)
    if (categoriesError) throw categoriesError
    for (const category of categories) existingByName.set(category.name.toLocaleLowerCase(), category.id)
  }

  return existingByName
}

function toDatabaseRow(record, userId, categories) {
  const { category_name: categoryName, tags: _tags, ...fields } = record
  return {
    ...fields,
    user_id: userId,
    category_id: categoryName ? categories.get(categoryName.toLocaleLowerCase()) ?? null : null
  }
}

export async function importDataRecords(recordsByType, userId) {
  if (!userId) throw new Error('É necessário estar autenticado para importar dados.')
  const categories = await resolveCategories(recordsByType, userId)
  const result = {
    imported: { notes: 0, tasks: 0, events: 0 },
    errors: [],
    warnings: []
  }

  for (const type of ['tasks', 'events']) {
    const records = recordsByType[type]
    for (let start = 0; start < records.length; start += BATCH_SIZE) {
      const batch = records.slice(start, start + BATCH_SIZE)
      const rows = batch.map((record) => ({ ...toDatabaseRow(record, userId, categories), id: crypto.randomUUID() }))
      const { error } = await supabase.from(type).insert(rows)
      if (error) {
        result.errors.push({
          dataset: type,
          row: `${start + 1}-${start + batch.length}`,
          message: error.message
        })
      } else {
        result.imported[type] += batch.length
        if (type === 'tasks') {
          for (let index = 0; index < batch.length; index += 1) {
            if (batch[index].tags?.length) {
              try {
                await setResourceTags('task', rows[index].id, batch[index].tags)
              } catch (tagError) {
                result.warnings.push({ dataset: type, row: start + index + 1, message: `Tarefa importada sem tags: ${tagError.message}` })
              }
            }
          }
        }
      }
    }
  }

  for (let index = 0; index < recordsByType.notes.length; index += 1) {
    const record = recordsByType.notes[index]
    const { tags, ...note } = record
    const { data, error } = await supabase
      .from('notes')
      .insert(toDatabaseRow(note, userId, categories))
      .select('id')
      .single()
    if (error) {
      result.errors.push({ dataset: 'notes', row: index + 1, message: error.message })
      continue
    }
    result.imported.notes += 1
    if (tags.length > 0) {
      try {
        await setNoteTags(data.id, tags)
      } catch (tagError) {
        result.warnings.push({ dataset: 'notes', row: index + 1, message: `Nota importada sem tags: ${tagError.message}` })
      }
    }
  }

  return result
}
