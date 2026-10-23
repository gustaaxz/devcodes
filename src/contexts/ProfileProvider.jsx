import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { getProfile, saveProfile } from '../services/profile/profileService.js'
import { DEFAULT_PREFERENCES, applyTheme, mergePreferences, normalizePreferences, readCachedTheme } from '../utils/preferences.js'
import { ProfileContext } from './profileContext.js'

export function ProfileProvider({ children }) {
  const { user } = useAuth()
  const userId = user.id
  const [state, setState] = useState({
    status: 'loading',
    fullName: '',
    preferences: { ...DEFAULT_PREFERENCES, theme: readCachedTheme() }
  })
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  })

  useEffect(() => {
    let active = true
    getProfile(userId)
      .then((profile) => {
        if (!active) return
        setState({
          status: 'ready',
          fullName: profile?.full_name || '',
          preferences: normalizePreferences(profile?.preferences)
        })
      })
      .catch(() => {
        if (!active) return
        setState((current) => ({ ...current, status: 'error' }))
      })
    return () => {
      active = false
    }
  }, [userId])

  useEffect(() => {
    applyTheme(state.preferences.theme)
  }, [state.preferences.theme])

  const updatePreferences = useCallback(
    async (patch) => {
      const previous = stateRef.current
      const nextPreferences = mergePreferences(previous.preferences, patch)
      setState({ ...previous, preferences: nextPreferences })
      try {
        await saveProfile(userId, { preferences: nextPreferences })
      } catch (error) {
        setState((current) => ({ ...current, preferences: previous.preferences }))
        throw error
      }
    },
    [userId]
  )

  const updateFullName = useCallback(
    async (name) => {
      const saved = await saveProfile(userId, { full_name: name.trim() || null })
      setState((current) => ({ ...current, fullName: saved.full_name || '' }))
    },
    [userId]
  )

  const value = useMemo(
    () => ({
      status: state.status,
      fullName: state.fullName,
      preferences: state.preferences,
      updatePreferences,
      updateFullName
    }),
    [state, updatePreferences, updateFullName]
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
