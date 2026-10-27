const TEST_USER_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
const FACTOR_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff'

function jwtFor(level) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({
    sub: TEST_USER_ID, aud: 'authenticated', role: 'authenticated', aal: level,
    email: 'e2e@example.test', exp: now + 3600, iat: now
  })}.test-signature`
}

export async function mockSupabase(page, { mfaEnrolled = false } = {}) {
  let assuranceLevel = 'aal1'
  let factorEnrolled = mfaEnrolled
  const user = {
    id: TEST_USER_ID, aud: 'authenticated', role: 'authenticated', email: 'e2e@example.test',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { full_name: 'E2E User', username: 'e2e-user' },
    created_at: '2026-01-01T00:00:00.000Z'
  }
  const currentUser = () => ({
    ...user,
    ...(factorEnrolled ? { factors: [{ id: FACTOR_ID, factor_type: 'totp', status: 'verified', friendly_name: 'DevCodes' }] } : {})
  })
  const sessionResponse = () => ({
    access_token: jwtFor(assuranceLevel), refresh_token: 'e2e-refresh-token', token_type: 'bearer',
    expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: currentUser()
  })

  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request()
    const table = new URL(request.url()).pathname.split('/').pop()
    if (table === 'profiles' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          full_name: 'E2E User',
          preferences: { locale: 'pt-BR', theme: 'dark', onboardingCompleted: true }
        })
      })
      return
    }
    if (table === 'profiles' && request.method() !== 'GET') {
      const body = request.postDataJSON() ?? {}
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: TEST_USER_ID, full_name: body.full_name || 'E2E User', preferences: body.preferences || {} })
      })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]', headers: { 'content-range': '0-0/0' } })
  })

  await page.route('**/auth/v1/token*', async (route) => {
    if (new URL(route.request().url()).searchParams.get('grant_type') !== 'password') return route.continue()
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sessionResponse()) })
  })
  await page.route('**/auth/v1/signup*', async (route) => {
    const body = route.request().postDataJSON() ?? {}
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { ...user, user_metadata: body.data ?? user.user_metadata }, session: null }) })
  })
  await page.route('**/auth/v1/recover*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
  await page.route('**/auth/v1/user*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(currentUser()) }))
  await page.route('**/auth/v1/factors**', async (route) => {
    const request = route.request()
    const factorPath = new URL(request.url()).pathname
    if (request.method() === 'GET' && factorPath.endsWith('/factors')) {
      const factors = factorEnrolled ? [{ id: FACTOR_ID, factor_type: 'totp', status: 'verified', friendly_name: 'DevCodes' }] : []
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ all: factors, totp: factors, phone: [] }) })
      return
    }
    if (request.method() === 'POST' && factorPath.endsWith('/factors')) {
      factorEnrolled = true
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        id: FACTOR_ID, type: 'totp', friendly_name: 'DevCodes',
        totp: { qr_code: '<svg xmlns="http://www.w3.org/2000/svg"/>', secret: 'E2ESECRET' }
      }) })
      return
    }
    if (factorPath.endsWith('/challenge')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'e2e-challenge', expires_at: Math.floor(Date.now() / 1000) + 60 }) })
      return
    }
    if (factorPath.endsWith('/verify')) {
      const body = request.postDataJSON() ?? {}
      if (body.code !== '123456') {
        await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ code: 'mfa_verification_failed', message: 'Invalid TOTP code' }) })
        return
      }
      assuranceLevel = 'aal2'
      factorEnrolled = true
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sessionResponse()) })
      return
    }
    if (factorPath.includes(FACTOR_ID) && request.method() === 'DELETE') {
      factorEnrolled = false
      assuranceLevel = 'aal1'
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })
}

export async function signInAsE2eUser(page) {
  await page.goto('/entrar')
  await page.getByLabel('E-mail ou nome de usuário').fill('e2e@example.test')
  await page.getByLabel('Senha').fill('E2e-password-123!')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL('/')
  const skipTour = page.getByRole('button', { name: 'Pular tour' })
  if (await skipTour.isVisible().catch(() => false)) await skipTour.click()
}
