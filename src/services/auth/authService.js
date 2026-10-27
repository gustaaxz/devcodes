import { supabase } from '../supabase/client.js'

function getRedirectUrl(path) {
  return `${window.location.origin}${path}`
}

export async function signUp({ full_name, email, password, username }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, username: username?.toLowerCase() },
      emailRedirectTo: getRedirectUrl('/')
    }
  })
  if (error) throw error
  return data
}

export async function signIn({ email, password }) {
  // Resolve username to email if needed
  let authEmail = email
  
  // Try to resolve username to email if input doesn't contain @
  if (!email.includes('@')) {
    try {
      const { data, error } = await supabase.rpc('get_auth_email', { identifier: email })
      if (!error && data) {
        authEmail = data
      }
    } catch {
      // If RPC fails, fall back to using the input as-is
    }
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getRedirectUrl('/redefinir-senha')
  })
  if (error) throw error
}

export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

export async function listMfaFactors() {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error
  return data
}

export async function enrollTotpFactor(friendlyName = 'DevCodes') {
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName })
  if (error) throw error
  return data
}

export async function verifyMfaFactor({ factorId, code }) {
  const { data, error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
  if (error) throw error
  return data
}

export async function unenrollMfaFactor(factorId) {
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) throw error
}

export async function getMfaAssuranceLevel() {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) throw error
  return data
}
