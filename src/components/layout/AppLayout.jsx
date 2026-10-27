import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import FullScreenMessage from './FullScreenMessage.jsx'
import ShortcutsModal from '../ui/ShortcutsModal.jsx'
import Spinner from '../ui/Spinner.jsx'
import { DataVersionProvider } from '../../contexts/DataVersionProvider.jsx'
import { ProfileProvider } from '../../contexts/ProfileProvider.jsx'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts.js'
import { useProfile } from '../../hooks/useProfile.js'
import { useTaskReminders } from '../../hooks/useTaskReminders.js'
import { getPageTitle } from '../../utils/navigation.js'
import './AppLayout.css'

function AppFrame() {
  const { status } = useProfile()
  const reminderState = useTaskReminders()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem('devcodes.sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  function toggleSidebar() {
    const nextValue = !collapsed
    setCollapsed(nextValue)
    try {
      window.localStorage.setItem('devcodes.sidebar-collapsed', String(nextValue))
    } catch {
      // Sidebar state remains available for the current session.
    }
  }

  useKeyboardShortcuts({
    openSearch: () => {
      // Focar no SearchBox (será implementado)
      const searchInput = document.querySelector('input[aria-label="Pesquisa global"]')
      if (searchInput) searchInput.focus()
    },
    newNote: () => navigate('/anotacoes?nova=1'),
    newTask: () => navigate('/tarefas'),
    newEvent: () => navigate('/calendario'),
    showShortcuts: () => setShowShortcuts(true)
  })

  if (status === 'loading') {
    return (
      <FullScreenMessage>
        <Spinner label="Carregando perfil" />
      </FullScreenMessage>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={collapsed}
        isMobile={isMobile}
        mobileOpen={isMobile && mobileOpen}
        onToggleCollapse={toggleSidebar}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="app-layout__main">
        <Topbar
          title={getPageTitle(pathname)}
          isMobile={isMobile}
          onOpenMobileMenu={() => setMobileOpen(true)}
          reminderState={reminderState}
        />
        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </div>
  )
}

export default function AppLayout() {
  return (
    <ProfileProvider>
      <DataVersionProvider>
        <AppFrame />
      </DataVersionProvider>
    </ProfileProvider>
  )
}
