import { supabase } from '../supabase/client.js'
import { ValidationError } from '../../utils/errors.js'
import { FILES_BUCKET, MAX_FILE_SIZE, getExtension, getFileType, sanitizeFileName, validateFile } from '../../utils/files.js'

const STORAGE_CONTENT_TYPE = 'text/plain;charset=UTF-8'

function resolveStorageContentType(type) {
  return type.kind === 'text' ? STORAGE_CONTENT_TYPE : type.mime
}

export const FILE_WITH_CATEGORY = '*, programming_categories(name)'

export async function listFiles() {
  const { data, error } = await supabase.from('stored_files').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function uploadFile({ userId, categoryId, file }) {
  const message = await validateFile(file)
  if (message) throw new ValidationError(message)

  const extension = getExtension(file.name)
  const type = getFileType(file.name)
  const id = crypto.randomUUID()
  const storageKey = `${userId}/${id}/${sanitizeFileName(file.name)}`

  const { error: uploadError } = await supabase.storage.from(FILES_BUCKET).upload(storageKey, file, {
    contentType: resolveStorageContentType(type),
    upsert: false
  })
  if (uploadError) throw uploadError

  const { data, error: insertError } = await supabase
    .from('stored_files')
    .insert({
      id,
      user_id: userId,
      category_id: categoryId,
      original_name: file.name,
      storage_key: storageKey,
      extension,
      mime_type: type.mime,
      size_bytes: file.size
    })
    .select('*')
    .single()

  if (insertError) {
    await supabase.storage.from(FILES_BUCKET).remove([storageKey])
    throw insertError
  }
  return data
}

export async function createTextFile({ userId, categoryId, name, content }) {
  const file = new File([content], name, { type: 'text/plain' })
  return uploadFile({ userId, categoryId, file })
}

export async function updateFileContent(record, content) {
  const blob = new Blob([content], { type: 'text/plain' })
  if (blob.size === 0) throw new ValidationError('O conteúdo não pode ficar vazio.')
  if (blob.size > MAX_FILE_SIZE) throw new ValidationError('O arquivo excede o limite de tamanho.')

  const { error: uploadError } = await supabase.storage.from(FILES_BUCKET).upload(record.storage_key, blob, {
    contentType: STORAGE_CONTENT_TYPE,
    upsert: true
  })
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('stored_files')
    .update({ size_bytes: blob.size })
    .eq('id', record.id)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateFileRecord(id, values) {
  const { data, error } = await supabase.from('stored_files').update(values).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function readFileText(record) {
  const { data, error } = await supabase.storage.from(FILES_BUCKET).download(record.storage_key)
  if (error) throw error
  return data.text()
}

export async function createPreviewUrl(record) {
  const { data, error } = await supabase.storage.from(FILES_BUCKET).createSignedUrl(record.storage_key, 60)
  if (error) throw error
  return data.signedUrl
}

export async function getDownloadUrl(record) {
  const { data, error } = await supabase.storage
    .from(FILES_BUCKET)
    .createSignedUrl(record.storage_key, 60, { download: record.original_name })
  if (error) throw error
  return data.signedUrl
}

export async function removeStorageObjects(keys) {
  for (let index = 0; index < keys.length; index += 100) {
    const { error } = await supabase.storage.from(FILES_BUCKET).remove(keys.slice(index, index + 100))
    if (error) throw error
  }
}

export async function deleteFile(record) {
  await removeStorageObjects([record.storage_key])
  const { error } = await supabase.from('stored_files').delete().eq('id', record.id)
  if (error) throw error
}

export async function downloadFile(record) {
  const url = await getDownloadUrl(record)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export async function listRecentFiles(limit = 30) {
  const { data, error } = await supabase
    .from('stored_files')
    .select(FILE_WITH_CATEGORY)
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}
