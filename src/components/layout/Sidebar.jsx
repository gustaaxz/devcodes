import { Fragment, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Code2, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { navigationItems } from '../../utils/navigation.js'
import { translate } from '../../utils/i18n.js'
import './Sidebar.css'

export default function Sidebar({ collapsed, isMobile, mobileOpen, locale = 'pt-BR', onToggleCollapse, onCloseMobile }) {
  const navigate = useNavigate()
  const isCollapsed = collapsed && !isMobile
  useEffect(() => {
    if (!isMobile || !mobileOpen) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onCloseMobile()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobile, mobileOpen, onCloseMobile])

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
      {isMobile && mobileOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={onCloseMobile}
          aria-label="Fechar menu de navegação"
        />
      )}
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

        <nav className="sidebar__nav" id="primary-navigation" aria-label="Seções">
          {navigationItems.map(({ path, labelKey, icon: Icon, section, sectionKey }, index) => {
            const showSection = !isCollapsed && (index === 0 || section !== navigationItems[index - 1].section)

            return (
              <Fragment key={path}>
                {showSection && <span className="sidebar__section-label">{translate(locale, sectionKey)}</span>}
                <NavLink
                  to={path}
                  end={path === '/'}
                  title={isCollapsed ? translate(locale, labelKey) : undefined}
                  onClick={isMobile ? onCloseMobile : undefined}
                  className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
                >
                  <Icon size={19} strokeWidth={1.9} />
                  {!isCollapsed && <span>{translate(locale, labelKey)}</span>}
                </NavLink>
              </Fragment>
            )
          })}
        </nav>

        {!isMobile && (
          <div className="sidebar__footer">
            <button
              type="button"
              className="sidebar__link sidebar__collapse"
              onClick={onToggleCollapse}
              title={translate(locale, isCollapsed ? 'nav.expand' : 'nav.collapse')}
              aria-expanded={!isCollapsed}
              aria-controls="primary-navigation"
              aria-label={translate(locale, isCollapsed ? 'nav.expand' : 'nav.collapse')}
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              {!isCollapsed && <span>{translate(locale, 'nav.collapse')}</span>}
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
