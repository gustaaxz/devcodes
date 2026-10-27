import { supabase } from '../supabase/client.js'

export const TAG_COLORS = [
  '#64748b', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'
]

const RESOURCES = {
  note: { table: 'note_tags', idColumn: 'note_id' },
  task: { table: 'task_tags', idColumn: 'task_id' },
  file: { table: 'file_tags', idColumn: 'file_id' }
}

export function normalizeTagNames(rawNames) {
  const unique = new Map()
  for (const raw of rawNames || []) {
    const name = String(raw).trim().replace(/\s+/g, ' ').slice(0, 40)
    if (name && !unique.has(name.toLocaleLowerCase())) unique.set(name.toLocaleLowerCase(), name)
  }
  return [...unique.values()]
}

export function validateTagName(rawName) {
  const name = String(rawName || '').trim().replace(/\s+/g, ' ')
  if (!name) return 'Informe o nome da tag.'
  if (name.length > 40) return 'O nome da tag deve ter no máximo 40 caracteres.'
  return ''
}

export function findOrphanedTagIds(candidateIds, linkedTagIds, favoriteIds = []) {
  const linked = new Set(linkedTagIds)
  const favorites = new Set(favoriteIds)
  return candidateIds.filter((id) => !linked.has(id) && !favorites.has(id))
}

export function suggestTags(tags, selectedNames, contextText, limit = 5) {
  const context = String(contextText || '').toLocaleLowerCase()
  const selected = new Set(normalizeTagNames(selectedNames).map((name) => name.toLocaleLowerCase()))
  return (tags || [])
    .filter((tag) => {
      const name = typeof tag === 'string' ? tag : tag.name
      const normalizedName = name.toLocaleLowerCase()
      return name.length >= 3 && !selected.has(normalizedName) && context.includes(normalizedName)
    })
    .slice(0, limit)
}

function countByTag(rows) {
  const counts = new Map()
  for (const row of rows || []) counts.set(row.tag_id, (counts.get(row.tag_id) || 0) + 1)
  return counts
}

async function cleanupUnusedTags(userId, candidateIds) {
  if (!candidateIds.length) return
  const results = await Promise.all([
    supabase.from('note_tags').select('tag_id').in('tag_id', candidateIds),
    supabase.from('task_tags').select('tag_id').in('tag_id', candidateIds),
    supabase.from('file_tags').select('tag_id').in('tag_id', candidateIds),
    supabase.from('tags').select('id, is_favorite').eq('user_id', userId).in('id', candidateIds)
  ])
  for (const result of results) {
    if (result.error) throw result.error
  }
  const linkedIds = results.slice(0, 3).flatMap((result) => result.data.map((row) => row.tag_id))
  const favoriteIds = results[3].data.filter((tag) => tag.is_favorite).map((tag) => tag.id)
  const orphanIds = findOrphanedTagIds(candidateIds, linkedIds, favoriteIds)
  if (orphanIds.length) {
    const { error } = await supabase.from('tags').delete().eq('user_id', userId).in('id', orphanIds)
    if (error) throw error
  }
}

export async function listTags() {
  const [tagsResult, notesResult, tasksResult, filesResult] = await Promise.all([
    supabase.from('tags').select('id, name, color, is_favorite, created_at').order('name'),
    supabase.from('note_tags').select('tag_id'),
    supabase.from('task_tags').select('tag_id'),
    supabase.from('file_tags').select('tag_id')
  ])
  for (const result of [tagsResult, notesResult, tasksResult, filesResult]) {
    if (result.error) throw result.error
  }

  const notes = countByTag(notesResult.data)
  const tasks = countByTag(tasksResult.data)
  const files = countByTag(filesResult.data)
  return tagsResult.data.map((tag) => {
    const usage = { notes: notes.get(tag.id) || 0, tasks: tasks.get(tag.id) || 0, files: files.get(tag.id) || 0 }
    return { ...tag, usage, usage_count: usage.notes + usage.tasks + usage.files }
  })
}

export async function searchTags(term) {
  const query = String(term || '').trim().toLocaleLowerCase()
  const tags = await listTags()
  return tags.filter((tag) => tag.name.toLocaleLowerCase().includes(query))
}

export async function getTopTags(limit = 10) {
  const tags = await listTags()
  return tags.sort((a, b) => b.usage_count - a.usage_count || a.name.localeCompare(b.name, 'pt-BR')).slice(0, limit)
}

export async function setResourceTags(resourceType, resourceId, rawNames) {
  const resource = RESOURCES[resourceType]
  if (!resource) throw new Error('Tipo de recurso inválido para tags.')
  const names = normalizeTagNames(rawNames)
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  const userId = authData.user?.id
  if (!userId) throw new Error('É necessário estar autenticado para salvar tags.')

  const { data: ownedTags, error: ownedTagsError } = await supabase.from('tags').select('id, name, color, is_favorite').eq('user_id', userId)
  if (ownedTagsError) throw ownedTagsError
  const byNormalizedName = new Map(ownedTags.map((tag) => [tag.name.toLocaleLowerCase(), tag]))
  const newNames = names.filter((name) => !byNormalizedName.has(name.toLocaleLowerCase()))

  if (newNames.length > 0) {
    const { error } = await supabase
      .from('tags')
      .upsert(newNames.map((name) => ({ user_id: userId, name })), { onConflict: 'user_id,name', ignoreDuplicates: true })
    if (error) throw error
  }

  if (newNames.length > 0) {
    const { data: insertedTags, error } = await supabase.from('tags').select('id, name, color, is_favorite').eq('user_id', userId).in('name', newNames)
    if (error) throw error
    for (const tag of insertedTags) byNormalizedName.set(tag.name.toLocaleLowerCase(), tag)
  }
  const targetTags = names.map((name) => byNormalizedName.get(name.toLocaleLowerCase())).filter(Boolean)
  const targetIds = targetTags.map((tag) => tag.id)

  const { data: currentRows, error: currentError } = await supabase
    .from(resource.table)
    .select('tag_id')
    .eq(resource.idColumn, resourceId)
  if (currentError) throw currentError

  const currentIds = currentRows.map((row) => row.tag_id)
  const toRemove = currentIds.filter((id) => !targetIds.includes(id))
  const toAdd = targetIds.filter((id) => !currentIds.includes(id))
  if (toRemove.length) {
    const { error } = await supabase.from(resource.table).delete().eq(resource.idColumn, resourceId).in('tag_id', toRemove)
    if (error) throw error
  }
  if (toAdd.length) {
    const { error } = await supabase.from(resource.table).insert(toAdd.map((tagId) => ({ [resource.idColumn]: resourceId, tag_id: tagId })))
    if (error) throw error
  }
  await cleanupUnusedTags(userId, toRemove)
  return targetTags
}

export async function updateTag(tagId, values) {
  const patch = {}
  if (values.name !== undefined) {
    const message = validateTagName(values.name)
    if (message) throw new Error(message)
    const normalizedName = values.name.trim().replace(/\s+/g, ' ')
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError
    if (!authData.user) throw new Error('É necessário estar autenticado para editar tags.')
    const { data: ownedTags, error: queryError } = await supabase.from('tags').select('id, name').eq('user_id', authData.user.id)
    if (queryError) throw queryError
    if (ownedTags.some((tag) => tag.id !== tagId && tag.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase())) {
      throw new Error('Já existe uma tag com esse nome.')
    }
    patch.name = normalizedName
  }
  if (values.color !== undefined) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(values.color)) throw new Error('Escolha uma cor hexadecimal válida.')
    patch.color = values.color
  }
  if (values.is_favorite !== undefined) patch.is_favorite = Boolean(values.is_favorite)
  const { data, error } = await supabase.from('tags').update(patch).eq('id', tagId).select('id, name, color, is_favorite').single()
  if (error) throw error
  return data
}

export async function createTag(rawName, color = TAG_COLORS[0]) {
  const message = validateTagName(rawName)
  if (message) throw new Error(message)
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) throw new Error('Escolha uma cor hexadecimal válida.')
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!authData.user) throw new Error('É necessário estar autenticado para criar tags.')
  const normalizedName = rawName.trim().replace(/\s+/g, ' ')
  const { data: existingTags, error: existingError } = await supabase.from('tags').select('name').eq('user_id', authData.user.id)
  if (existingError) throw existingError
  if (existingTags.some((tag) => tag.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase())) {
    throw new Error('Já existe uma tag com esse nome.')
  }
  const { data, error } = await supabase
    .from('tags')
    .insert({ user_id: authData.user.id, name: normalizedName, color })
    .select('id, name, color, is_favorite')
    .single()
  if (error) throw error
  return data
}

export async function deleteTag(tagId) {
  const { error } = await supabase.from('tags').delete().eq('id', tagId)
  if (error) throw error
}

export async function mergeTags(sourceId, targetId) {
  if (sourceId === targetId) throw new Error('Escolha duas tags diferentes para mesclar.')
  for (const resource of Object.values(RESOURCES)) {
    const { data: links, error: selectError } = await supabase.from(resource.table).select(resource.idColumn).eq('tag_id', sourceId)
    if (selectError) throw selectError
    if (links.length) {
      const rows = links.map((link) => ({ [resource.idColumn]: link[resource.idColumn], tag_id: targetId }))
      const { error: insertError } = await supabase
        .from(resource.table)
        .upsert(rows, { onConflict: `${resource.idColumn},tag_id`, ignoreDuplicates: true })
      if (insertError) throw insertError
      const { error: deleteError } = await supabase.from(resource.table).delete().eq('tag_id', sourceId)
      if (deleteError) throw deleteError
    }
  }
  await deleteTag(sourceId)
}
