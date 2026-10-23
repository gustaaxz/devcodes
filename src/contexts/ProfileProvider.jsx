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
    displayName: '',
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
          displayName: profile?.display_name || '',
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

  const updateDisplayName = useCallback(
    async (name) => {
      const saved = await saveProfile(userId, { display_name: name.trim() || null })
      setState((current) => ({ ...current, displayName: saved.display_name || '' }))
    },
    [userId]
  )

  const value = useMemo(
    () => ({
      status: state.status,
      displayName: state.displayName,
      preferences: state.preferences,
      updatePreferences,
      updateDisplayName
    }),
    [state, updatePreferences, updateDisplayName]
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
