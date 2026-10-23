import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import FullScreenMessage from './FullScreenMessage.jsx'
import Spinner from '../ui/Spinner.jsx'
import { DataVersionProvider } from '../../contexts/DataVersionProvider.jsx'
import { ProfileProvider } from '../../contexts/ProfileProvider.jsx'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import { useProfile } from '../../hooks/useProfile.js'
import { getPageTitle } from '../../utils/navigation.js'
import './AppLayout.css'

function AppFrame() {
  const { status } = useProfile()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

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
        onToggleCollapse={() => setCollapsed((value) => !value)}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="app-layout__main">
        <Topbar title={getPageTitle(pathname)} isMobile={isMobile} onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>
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
