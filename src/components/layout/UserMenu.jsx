import { useEffect, useRef, useState } from 'react'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useProfile } from '../../hooks/useProfile.js'
import './UserMenu.css'

export default function UserMenu() {
  const { user, signOut } = useAuth()
  const { displayName: profileName } = useProfile()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false)
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  async function handleSignOut() {
    setError('')
    try {
      await signOut()
    } catch {
      setError('Não foi possível encerrar a sessão.')
    }
  }

  const displayName = profileName || user?.user_metadata?.display_name || 'Usuário'

  return (
    <div className="user-menu" ref={containerRef}>
      <button
        type="button"
        className="topbar__profile"
        aria-label="Perfil do usuário"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <User size={18} />
      </button>
      {open && (
        <div className="user-menu__panel" role="menu">
          <div className="user-menu__identity">
            <strong>{displayName}</strong>
            <span>{user?.email}</span>
          </div>
          {error && <p className="user-menu__error">{error}</p>}
          <button type="button" className="user-menu__item" role="menuitem" onClick={handleSignOut}>
            <LogOut size={16} />
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
