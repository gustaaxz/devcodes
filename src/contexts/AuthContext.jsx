import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../services/supabase/client.js'
import * as authService from '../services/auth/authService.js'
import { AuthContext } from './authContext.js'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState(isSupabaseConfigured ? 'loading' : 'unconfigured')
  const [sessionExpired, setSessionExpired] = useState(false)
  const [recovery, setRecovery] = useState(false)
  const hadSession = useRef(false)
  const manualSignOut = useRef(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)

      if (event === 'SIGNED_OUT') {
        if (!manualSignOut.current && hadSession.current) setSessionExpired(true)
        manualSignOut.current = false
        hadSession.current = false
        setRecovery(false)
      }

      if (nextSession) {
        hadSession.current = true
        setSessionExpired(false)
      }

      setSession(nextSession)
      setStatus(nextSession ? 'authenticated' : 'unauthenticated')
    })

    return () => data.subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    manualSignOut.current = true
    try {
      await authService.signOut()
    } catch (error) {
      manualSignOut.current = false
      throw error
    }
  }, [])

  const clearRecovery = useCallback(() => setRecovery(false), [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      status,
      sessionExpired,
      recovery,
      clearRecovery,
      signUp: authService.signUp,
      signIn: authService.signIn,
      signOut,
      requestPasswordReset: authService.requestPasswordReset,
      updatePassword: authService.updatePassword
    }),
    [session, status, sessionExpired, recovery, clearRecovery, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
