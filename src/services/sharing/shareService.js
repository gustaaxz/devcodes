import { supabase } from '../supabase/client.js'

// ─── Note shares ────────────────────────────────────────────

/**
 * Generate (or get existing) a public share link for a note.
 * Returns the share record { id, share_token, permission, expires_at }.
 */
export async function generateNotePublicLink(noteId, ownerId, { permission = 'view', expiresAt = null } = {}) {
  const { data, error } = await supabase
    .from('note_shares')
    .insert({ note_id: noteId, owner_id: ownerId, permission, expires_at: expiresAt })
    .select('id, share_token, permission, expires_at')
    .single()
  if (error) throw error
  return data
}

/**
 * Share a note with a specific user by email.
 */
export async function shareNoteWithUser(noteId, ownerId, email, { permission = 'view', expiresAt = null } = {}) {
  const { data: targetId, error: rpcError } = await supabase.rpc('get_user_id_by_email', { lookup_email: email })
  if (rpcError) throw rpcError
  if (!targetId) throw new Error('Nenhum usuário cadastrado com este e-mail.')
  if (targetId === ownerId) throw new Error('Você não pode compartilhar com você mesmo.')

  const { data, error } = await supabase
    .from('note_shares')
    .insert({ note_id: noteId, owner_id: ownerId, shared_with_user_id: targetId, permission, expires_at: expiresAt })
    .select('id, share_token, permission, shared_with_user_id, expires_at')
    .single()
  if (error) throw error
  return data
}

/**
 * List all shares for a note (owned by the current user).
 */
export async function listNoteShares(noteId) {
  const { data, error } = await supabase
    .from('note_shares')
    .select('id, share_token, permission, shared_with_user_id, expires_at, created_at')
    .eq('note_id', noteId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/**
 * Revoke a specific share by its id.
 */
export async function revokeNoteShare(shareId) {
  const { error } = await supabase.from('note_shares').delete().eq('id', shareId)
  if (error) throw error
}

/**
 * Fetch a shared note by public token.
 * Tries the RPC `get_shared_note` first, falling back to direct table select.
 */
export async function getSharedNote(token) {
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_shared_note', { p_token: token })
    if (!rpcError && rpcData) {
      if (rpcData.error === 'expired') throw new Error('Este link de compartilhamento expirou.')
      return rpcData
    }
  } catch (err) {
    if (err.message === 'Este link de compartilhamento expirou.') throw err
    // otherwise fallback
  }

  // Direct table query fallback
  const { data: share, error: shareError } = await supabase
    .from('note_shares')
    .select('id, permission, expires_at, note_id')
    .eq('share_token', token)
    .single()
  if (shareError) throw shareError
  if (!share) throw new Error('Link de compartilhamento não encontrado.')

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    throw new Error('Este link de compartilhamento expirou.')
  }

  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select('id, title, content, created_at, updated_at, category_id')
    .eq('id', share.note_id)
    .single()
  if (noteError) throw noteError

  return { note, permission: share.permission, expires_at: share.expires_at, author: null }
}

// ─── Event shares ────────────────────────────────────────────

/**
 * Generate (or get existing) a public share link for an event.
 */
export async function generateEventPublicLink(eventId, ownerId, { permission = 'view', expiresAt = null } = {}) {
  const { data, error } = await supabase
    .from('event_shares')
    .insert({ event_id: eventId, owner_id: ownerId, permission, expires_at: expiresAt })
    .select('id, share_token, permission, expires_at')
    .single()
  if (error) throw error
  return data
}

/**
 * Share an event with a specific user by email.
 */
export async function shareEventWithUser(eventId, ownerId, email, { permission = 'view', expiresAt = null } = {}) {
  const { data: targetId, error: rpcError } = await supabase.rpc('get_user_id_by_email', { lookup_email: email })
  if (rpcError) throw rpcError
  if (!targetId) throw new Error('Nenhum usuário cadastrado com este e-mail.')
  if (targetId === ownerId) throw new Error('Você não pode compartilhar com você mesmo.')

  const { data, error } = await supabase
    .from('event_shares')
    .insert({ event_id: eventId, owner_id: ownerId, shared_with_user_id: targetId, permission, expires_at: expiresAt })
    .select('id, share_token, permission, shared_with_user_id, expires_at')
    .single()
  if (error) throw error
  return data
}

/**
 * List all shares for an event.
 */
export async function listEventShares(eventId) {
  const { data, error } = await supabase
    .from('event_shares')
    .select('id, share_token, permission, shared_with_user_id, expires_at, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/**
 * Revoke a specific event share by its id.
 */
export async function revokeEventShare(shareId) {
  const { error } = await supabase.from('event_shares').delete().eq('id', shareId)
  if (error) throw error
}

/**
 * Fetch a shared event by public token.
 */
export async function getSharedEvent(token) {
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_shared_event', { p_token: token })
    if (!rpcError && rpcData) {
      if (rpcData.error === 'expired') throw new Error('Este link de compartilhamento expirou.')
      return rpcData
    }
  } catch (err) {
    if (err.message === 'Este link de compartilhamento expirou.') throw err
  }

  const { data: share, error: shareError } = await supabase
    .from('event_shares')
    .select('id, permission, expires_at, event_id')
    .eq('share_token', token)
    .single()
  if (shareError) throw shareError
  if (!share) throw new Error('Link de compartilhamento não encontrado.')

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    throw new Error('Este link de compartilhamento expirou.')
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title, description, start_at, end_at, priority, status, category_id')
    .eq('id', share.event_id)
    .single()
  if (eventError) throw eventError

  return { event, permission: share.permission, expires_at: share.expires_at, author: null }
}

// ─── Shared With Me ──────────────────────────────────────────

/**
 * Fetch resources shared directly with the current user.
 */
export async function getSharedWithMe() {
  const [notesRes, eventsRes] = await Promise.all([
    supabase
      .from('note_shares')
      .select('id, permission, expires_at, notes (id, title, updated_at)')
      .not('shared_with_user_id', 'is', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('event_shares')
      .select('id, permission, expires_at, events (id, title, start_at, end_at)')
      .not('shared_with_user_id', 'is', null)
      .order('created_at', { ascending: false })
  ])

  return {
    notes: (notesRes.data || []).filter((s) => !s.expires_at || new Date(s.expires_at) > new Date()),
    events: (eventsRes.data || []).filter((s) => !s.expires_at || new Date(s.expires_at) > new Date()),
  }
}

/**
 * Copy a shared note into the user's personal notes collection.
 */
export async function copySharedNoteToLibrary(note, userId) {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      title: `${note.title || 'Sem título'} (Cópia)`,
      content: note.content || '',
      category_id: null,
      linked_date: null
    })
    .select('id, title')
    .single()
  if (error) throw error
  return data
}
