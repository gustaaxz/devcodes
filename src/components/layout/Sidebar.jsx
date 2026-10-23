import { NavLink, useNavigate } from 'react-router-dom'
import { Code2, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { navigationItems } from '../../utils/navigation.js'
import './Sidebar.css'

export default function Sidebar({ collapsed, isMobile, mobileOpen, onToggleCollapse, onCloseMobile }) {
  const navigate = useNavigate()
  const isCollapsed = collapsed && !isMobile
  const classes = [
    'sidebar',
    isCollapsed ? 'sidebar--collapsed' : '',
    isMobile ? 'sidebar--mobile' : '',
    isMobile && mobileOpen ? 'sidebar--open' : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      {isMobile && mobileOpen && <div className="sidebar-overlay" onClick={onCloseMobile} />}
      <aside className={classes} aria-label="Navegação principal">
        <div className="sidebar__header">
          <button
            type="button"
            className="sidebar__brand"
            onClick={() => navigate('/')}
            title="Ir para o Dashboard"
            aria-label="DevCodes - Ir para o Dashboard"
          >
            <span className="sidebar__logo">
              <Code2 size={20} strokeWidth={2.25} />
            </span>
            {!isCollapsed && <span className="sidebar__name">DevCodes</span>}
          </button>
          {isMobile && (
            <button type="button" className="icon-button" onClick={onCloseMobile} aria-label="Fechar menu">
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="sidebar__nav">
          {navigationItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              title={isCollapsed ? label : undefined}
              onClick={isMobile ? onCloseMobile : undefined}
              className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
            >
              <Icon size={18} strokeWidth={1.9} />
              {!isCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {!isMobile && (
          <div className="sidebar__footer">
            <button
              type="button"
              className="sidebar__link sidebar__collapse"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              {!isCollapsed && <span>Recolher</span>}
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
