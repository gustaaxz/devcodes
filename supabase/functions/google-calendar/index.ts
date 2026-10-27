import {
  base64Url,
  corsHeaders,
  createAdminClient,
  decryptRefreshToken,
  getAuthenticatedUserId,
  getSupabaseUrl,
  jsonResponse,
  requiredGoogleConfiguration,
  sha256
} from '../_shared/googleCalendar.ts'
import { syncGoogleCalendar } from './sync.ts'

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly'
]

function randomToken(byteCount: number) {
  return base64Url(crypto.getRandomValues(new Uint8Array(byteCount)))
}

async function beginOAuth(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { clientId, redirectUri } = requiredGoogleConfiguration()
  const state = randomToken(32)
  const verifier = randomToken(64)
  const challenge = await sha256(verifier)
  const { error: cleanupError } = await admin.from('google_calendar_oauth_states').delete().eq('user_id', userId).lt('expires_at', new Date().toISOString())
  if (cleanupError) throw cleanupError
  const { error } = await admin.from('google_calendar_oauth_states').insert({
    state_hash: await sha256(state),
    user_id: userId,
    code_verifier: verifier,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  })
  if (error) throw error

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true'
  }).toString()
  return { authorizationUrl: url.toString() }
}

async function accessToken(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: credential, error } = await admin
    .from('google_calendar_credentials')
    .select('refresh_token_ciphertext, refresh_token_iv')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!credential) throw new Error('Conecte sua conta Google antes de continuar.')

  const refreshToken = await decryptRefreshToken(credential.refresh_token_ciphertext, credential.refresh_token_iv)
  const { clientId, clientSecret } = requiredGoogleConfiguration()
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  })
  const data = await response.json()
  if (!response.ok || !data.access_token) {
    if (data.error === 'invalid_grant') {
      await admin.from('google_calendar_credentials').delete().eq('user_id', userId)
      await admin.from('google_calendar_integration').delete().eq('user_id', userId)
      throw new Error('A autorização Google expirou ou foi revogada. Conecte a conta novamente.')
    }
    throw new Error('Não foi possível renovar a autorização do Google Calendar.')
  }
  return data.access_token as string
}

async function getCalendars(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const token = await accessToken(admin, userId)
  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250&minAccessRole=writer', {
    headers: { Authorization: `Bearer ${token}` }
  })
  const body = await response.json()
  if (!response.ok) throw new Error('Não foi possível listar os calendários da conta Google.')
  return (body.items || []).map((calendar: Record<string, unknown>) => ({
    id: calendar.id,
    summary: calendar.summary || calendar.id,
    timeZone: calendar.timeZone || 'UTC',
    primary: calendar.primary === true,
    accessRole: calendar.accessRole
  }))
}

async function handleAction(action: string, body: Record<string, unknown>, userId: string) {
  const admin = createAdminClient()
  if (action === 'begin') return beginOAuth(admin, userId)

  if (action === 'disconnect') {
    const { data: credential, error: credentialError } = await admin
      .from('google_calendar_credentials')
      .select('refresh_token_ciphertext, refresh_token_iv')
      .eq('user_id', userId)
      .maybeSingle()
    if (credentialError) throw credentialError
    if (credential) {
      const refreshToken = await decryptRefreshToken(credential.refresh_token_ciphertext, credential.refresh_token_iv)
      const response = await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: refreshToken })
      })
      if (!response.ok) throw new Error('O Google não confirmou a revogação da autorização. Tente novamente.')
    }
    const results = await Promise.all([
      admin.from('google_calendar_credentials').delete().eq('user_id', userId),
      admin.from('google_calendar_integration').delete().eq('user_id', userId),
      admin.from('google_calendar_oauth_states').delete().eq('user_id', userId),
      admin.from('event_google_mapping').delete().eq('user_id', userId)
    ])
    const failed = results.find((result) => result.error)
    if (failed?.error) throw failed.error
    return { disconnected: true }
  }

  if (action === 'set-auto-sync') {
    const enabled = body.enabled === true
    if (enabled) {
      const { data: credential, error: credentialError } = await admin
        .from('google_calendar_credentials').select('user_id').eq('user_id', userId).maybeSingle()
      if (credentialError) throw credentialError
      if (!credential) throw new Error('Conecte sua conta Google antes de ativar a sincronização automática.')
    }
    const { data: integration, error } = await admin.from('google_calendar_integration')
      .update({ sync_enabled: enabled, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select('sync_enabled')
      .maybeSingle()
    if (error) throw error
    if (!integration) throw new Error('Conecte sua conta Google antes de alterar a sincronização automática.')
    return { syncEnabled: enabled }
  }

  if (action === 'feed-status') {
    const { data, error } = await admin.from('ical_calendar_feeds').select('created_at, last_accessed_at').eq('user_id', userId).maybeSingle()
    if (error) throw error
    return { active: Boolean(data), createdAt: data?.created_at || null, lastAccessedAt: data?.last_accessed_at || null }
  }

  if (action === 'create-feed') {
    const timeZone = String(body.timeZone || 'UTC')
    try {
      new Intl.DateTimeFormat('en-US', { timeZone })
    } catch {
      throw new Error('Fuso horário inválido para o feed.')
    }
    const token = randomToken(32)
    const { error } = await admin.from('ical_calendar_feeds').upsert({
      user_id: userId,
      token_hash: await sha256(token),
      time_zone: timeZone,
      created_at: new Date().toISOString(),
      last_accessed_at: null
    })
    if (error) throw error
    const feedUrl = `${getSupabaseUrl().replace(/\/$/, '')}/functions/v1/ical-feed?token=${encodeURIComponent(token)}`
    return { feedUrl }
  }

  if (action === 'revoke-feed') {
    const { error } = await admin.from('ical_calendar_feeds').delete().eq('user_id', userId)
    if (error) throw error
    return { revoked: true }
  }

  if (action === 'calendars') return { calendars: await getCalendars(admin, userId) }

  if (action === 'select-calendar') {
    const calendarId = String(body.calendarId || '')
    if (!calendarId) throw new Error('Selecione um calendário.')
    const calendars = await getCalendars(admin, userId)
    const selected = calendars.find((calendar: Record<string, unknown>) => calendar.id === calendarId)
    if (!selected) throw new Error('Esse calendário não está disponível para gravação na sua conta.')
    const { error } = await admin.from('google_calendar_integration').upsert({
      user_id: userId,
      selected_calendar_id: String(selected.id),
      selected_calendar_summary: String(selected.summary),
      selected_calendar_time_zone: String(selected.timeZone),
      sync_token: null,
      last_synced_at: null,
      updated_at: new Date().toISOString()
    })
    if (error) throw error
    return { selected }
  }

  if (action === 'sync') {
    const token = await accessToken(admin, userId)
    return syncGoogleCalendar(admin, userId, token)
  }
  throw new Error('Ação de calendário desconhecida.')
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() })
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const userId = await getAuthenticatedUserId(request)
    const body = await request.json()
    const result = await handleAction(String(body.action || ''), body, userId)
    return jsonResponse(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível concluir a ação do Google Calendar.'
    const status = message === 'AUTH_REQUIRED' ? 401 : 400
    return jsonResponse({ error: status === 401 ? 'Sessão inválida.' : message }, status)
  }
})
