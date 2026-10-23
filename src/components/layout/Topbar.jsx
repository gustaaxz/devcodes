import { useState } from 'react'
import { Menu, Moon, Search, Sun, X } from 'lucide-react'
import QuickCreateMenu from './QuickCreateMenu.jsx'
import SearchBox from './SearchBox.jsx'
import UserMenu from './UserMenu.jsx'
import { useProfile } from '../../hooks/useProfile.js'
import './Topbar.css'

export default function Topbar({ title, isMobile, onOpenMobileMenu }) {
  const { preferences, updatePreferences } = useProfile()
  const [mobileSearch, setMobileSearch] = useState(false)
  const theme = preferences.theme

  function toggleTheme() {
    updatePreferences({ theme: theme === 'dark' ? 'light' : 'dark' }).catch(() => {})
  }

  return (
    <header className="topbar-wrapper">
      <div className="topbar">
        <div className="topbar__left">
          {isMobile && (
            <button type="button" className="icon-button" onClick={onOpenMobileMenu} aria-label="Abrir menu">
              <Menu size={20} />
            </button>
          )}
          <h1 className="topbar__title">{title}</h1>
        </div>

        {!isMobile && <SearchBox />}

        <div className="topbar__actions">
          {isMobile && (
            <button
              type="button"
              className="icon-button"
              onClick={() => setMobileSearch((value) => !value)}
              aria-label={mobileSearch ? 'Fechar pesquisa' : 'Abrir pesquisa'}
            >
              {mobileSearch ? <X size={18} /> : <Search size={18} />}
            </button>
          )}
          <QuickCreateMenu compact={isMobile} />
          <button
            type="button"
            className="icon-button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <UserMenu />
        </div>
      </div>

      {isMobile && mobileSearch && (
        <div className="topbar__mobile-search">
          <SearchBox autoFocus onNavigate={() => setMobileSearch(false)} />
        </div>
      )}
    </header>
  )
}
