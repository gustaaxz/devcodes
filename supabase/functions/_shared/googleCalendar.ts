import { createClient } from 'npm:@supabase/supabase-js@2'

export function getSupabaseUrl() {
  const value = Deno.env.get('SUPABASE_URL')
  if (!value) throw new Error('SUPABASE_URL não está configurada.')
  return value
}

function getKey(name: 'SUPABASE_PUBLISHABLE_KEYS' | 'SUPABASE_SECRET_KEYS', legacyName: string) {
  const raw = Deno.env.get(name)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      const value = parsed.default || Object.values(parsed)[0]
      if (typeof value === 'string') return value
    } catch {
      return raw
    }
  }
  const legacy = Deno.env.get(legacyName)
  if (legacy) return legacy
  throw new Error(`${name} não está configurada.`)
}

export function createAdminClient() {
  return createClient(getSupabaseUrl(), getKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

export async function getAuthenticatedUserId(request: Request) {
  const authorization = request.headers.get('Authorization')
  if (!authorization) throw new Error('AUTH_REQUIRED')
  const client = createClient(getSupabaseUrl(), getKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } }
  })
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) throw new Error('AUTH_REQUIRED')
  return data.user.id
}

export function corsHeaders() {
  const appUrl = Deno.env.get('APP_URL')
  let origin = 'null'
  try {
    if (appUrl) origin = new URL(appUrl).origin
  } catch {
    origin = 'null'
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  }
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  })
}

export function base64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')), (char) => char.charCodeAt(0))
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return base64Url(new Uint8Array(digest))
}

export async function encryptRefreshToken(value: string) {
  const encodedKey = Deno.env.get('GOOGLE_TOKEN_ENCRYPTION_KEY')
  if (!encodedKey) throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY não está configurada.')
  const keyBytes = Uint8Array.from(atob(encodedKey), (char) => char.charCodeAt(0))
  if (keyBytes.length !== 32) throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY precisa conter 32 bytes em Base64.')
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(value))
  return { ciphertext: base64Url(new Uint8Array(encrypted)), iv: base64Url(iv) }
}

export async function decryptRefreshToken(ciphertext: string, ivValue: string) {
  const encodedKey = Deno.env.get('GOOGLE_TOKEN_ENCRYPTION_KEY')
  if (!encodedKey) throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY não está configurada.')
  const keyBytes = Uint8Array.from(atob(encodedKey), (char) => char.charCodeAt(0))
  if (keyBytes.length !== 32) throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY precisa conter 32 bytes em Base64.')
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt'])
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64Url(ivValue) }, key, fromBase64Url(ciphertext))
  return new TextDecoder().decode(plaintext)
}

export function requiredGoogleConfiguration() {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
  const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI')
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('A integração Google ainda não foi configurada no Supabase.')
  }
  return { clientId, clientSecret, redirectUri }
}
