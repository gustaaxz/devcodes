import { useContext } from 'react'
import { ProfileContext } from '../contexts/profileContext.js'

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) throw new Error('useProfile deve ser utilizado dentro de ProfileProvider')
  return context
}
