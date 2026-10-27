import { createAdminClient, decryptRefreshToken, encryptRefreshToken, requiredGoogleConfiguration, sha256 } from '../_shared/googleCalendar.ts'

function redirectToSettings(result: 'connected' | 'error') {
  const appUrl = Deno.env.get('APP_URL')
  if (!appUrl) return new Response('Integração processada. Feche esta janela e retorne ao DevCodes.', { status: result === 'connected' ? 200 : 400 })
  const destination = new URL('/settings', appUrl)
  destination.searchParams.set('google_calendar', result)
  return Response.redirect(destination, 303)
}

Deno.serve(async (request) => {
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 })
  const url = new URL(request.url)
  if (url.searchParams.has('error')) return redirectToSettings('error')

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  if (!code || !state) return redirectToSettings('error')

  try {
    const admin = createAdminClient()
    const stateHash = await sha256(state)
    const { data: oauthState, error: stateError } = await admin
      .from('google_calendar_oauth_states')
      .select('user_id, code_verifier')
      .eq('state_hash', stateHash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
    if (stateError || !oauthState) return redirectToSettings('error')

    const { error: consumeError } = await admin.from('google_calendar_oauth_states').delete().eq('state_hash', stateHash)
    if (consumeError) throw consumeError

    const { clientId, clientSecret, redirectUri } = requiredGoogleConfiguration()
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code_verifier: oauthState.code_verifier,
        grant_type: 'authorization_code'
      })
    })
    const tokenData = await tokenResponse.json()
    if (!tokenResponse.ok) throw new Error('GOOGLE_TOKEN_EXCHANGE_FAILED')
    const grantedScopes = String(tokenData.scope || '').split(' ')
    if (!['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.calendarlist.readonly'].every((scope) => grantedScopes.includes(scope))) {
      throw new Error('GOOGLE_SCOPE_MISSING')
    }

    let refreshToken = tokenData.refresh_token as string | undefined
    if (!refreshToken) {
      const { data: existing } = await admin
        .from('google_calendar_credentials')
        .select('refresh_token_ciphertext, refresh_token_iv')
        .eq('user_id', oauthState.user_id)
        .maybeSingle()
      if (!existing) throw new Error('GOOGLE_REFRESH_TOKEN_MISSING')
      refreshToken = await decryptRefreshToken(
        existing.refresh_token_ciphertext,
        existing.refresh_token_iv
      )
    }

    const encrypted = await encryptRefreshToken(refreshToken)
    const { error: credentialError } = await admin.from('google_calendar_credentials').upsert({
      user_id: oauthState.user_id,
      refresh_token_ciphertext: encrypted.ciphertext,
      refresh_token_iv: encrypted.iv,
      updated_at: new Date().toISOString()
    })
    if (credentialError) throw credentialError

    const { data: current } = await admin
      .from('google_calendar_integration')
      .select('selected_calendar_id, selected_calendar_summary, selected_calendar_time_zone, sync_enabled')
      .eq('user_id', oauthState.user_id)
      .maybeSingle()
    const { error: integrationError } = await admin.from('google_calendar_integration').upsert({
      user_id: oauthState.user_id,
      selected_calendar_id: current?.selected_calendar_id || 'primary',
      selected_calendar_summary: current?.selected_calendar_summary || 'Principal',
      selected_calendar_time_zone: current?.selected_calendar_time_zone || 'UTC',
      sync_enabled: current?.sync_enabled || false,
      updated_at: new Date().toISOString()
    })
    if (integrationError) throw integrationError
    return redirectToSettings('connected')
  } catch (error) {
    console.error('Google Calendar OAuth callback failed', error)
    return redirectToSettings('error')
  }
})
