import { supabase } from '../supabase/client.js'
import { removeStorageObjects } from '../files/filesService.js'
import { slugify } from '../../utils/files.js'

export async function listProgrammingCategories() {
  const { data, error } = await supabase
    .from('programming_categories')
    .select('*')
    .order('position')
    .order('created_at')
  if (error) throw error
  return data
}

function buildUniqueSlug(name, existing) {
  const taken = new Set(existing.map((category) => category.slug))
  const base = slugify(name)
  let slug = base
  let counter = 2
  while (taken.has(slug)) {
    slug = `${base}-${counter}`
    counter += 1
  }
  return slug
}

export async function createProgrammingCategory(userId, name, existing) {
  const position = existing.reduce((max, category) => Math.max(max, category.position), -1) + 1
  
  // Check for duplicate category names (case-insensitive)
  const duplicateName = existing.find((cat) => cat.name.toLowerCase() === name.trim().toLowerCase())
  if (duplicateName) {
    const error = new Error('Já existe uma categoria com esse nome.')
    error.code = 'DUPLICATE_CATEGORY_NAME'
    throw error
  }
  
  const { data, error } = await supabase
    .from('programming_categories')
    .insert({ user_id: userId, name: name.trim(), slug: buildUniqueSlug(name, existing), position })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function renameProgrammingCategory(id, name, existing) {
  // Check for duplicate category names (case-insensitive)
  const duplicateName = existing.find((cat) => cat.id !== id && cat.name.toLowerCase() === name.trim().toLowerCase())
  if (duplicateName) {
    const error = new Error('Já existe outra categoria com esse nome.')
    error.code = 'DUPLICATE_CATEGORY_NAME'
    throw error
  }
  
  const { error } = await supabase.from('programming_categories').update({ name: name.trim() }).eq('id', id)
  if (error) throw error
}

export async function swapCategoryPositions(first, second) {
  const { error: firstError } = await supabase
    .from('programming_categories')
    .update({ position: second.position })
    .eq('id', first.id)
  if (firstError) throw firstError
  const { error: secondError } = await supabase
    .from('programming_categories')
    .update({ position: first.position })
    .eq('id', second.id)
  if (secondError) throw secondError
}

export async function deleteEmptyCategory(id) {
  const { error } = await supabase.from('programming_categories').delete().eq('id', id)
  if (error) throw error
}

export async function moveFilesAndDeleteCategory(id, targetId) {
  const { error: moveError } = await supabase.from('stored_files').update({ category_id: targetId }).eq('category_id', id)
  if (moveError) throw moveError
  await deleteEmptyCategory(id)
}

export async function deleteFilesAndCategory(id, files) {
  await removeStorageObjects(files.map((file) => file.storage_key))
  const { error } = await supabase.from('stored_files').delete().eq('category_id', id)
  if (error) throw error
  await deleteEmptyCategory(id)
}
