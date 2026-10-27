import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  StickyNote,
  Code2,
  Clock,
  Star,
  Settings,
  Tags as TagsIcon,
  BarChart3
} from 'lucide-react'
import { translate } from './i18n.js'

export const navigationItems = [
  { path: '/', label: 'Dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, section: 'Visão geral', sectionKey: 'nav.overview' },
  { path: '/analytics', label: 'Produtividade', labelKey: 'nav.productivity', icon: BarChart3, section: 'Visão geral', sectionKey: 'nav.overview' },
  { path: '/calendario', label: 'Calendário', labelKey: 'nav.calendar', icon: CalendarDays, section: 'Organização', sectionKey: 'nav.organization' },
  { path: '/tarefas', label: 'Tarefas', labelKey: 'nav.tasks', icon: CheckSquare, section: 'Organização', sectionKey: 'nav.organization' },
  { path: '/anotacoes', label: 'Anotações', labelKey: 'nav.notes', icon: StickyNote, section: 'Organização', sectionKey: 'nav.organization' },
  { path: '/biblioteca', label: 'Biblioteca de Programação', labelKey: 'nav.library', icon: Code2, section: 'Organização', sectionKey: 'nav.organization' },
  { path: '/arquivos-recentes', label: 'Arquivos recentes', labelKey: 'nav.recent', icon: Clock, section: 'Organização', sectionKey: 'nav.organization' },
  { path: '/favoritos', label: 'Favoritos', labelKey: 'nav.favorites', icon: Star, section: 'Organização', sectionKey: 'nav.organization' },
  { path: '/tags', label: 'Tags', labelKey: 'nav.tags', icon: TagsIcon, section: 'Organização', sectionKey: 'nav.organization' },
  { path: '/configuracoes', label: 'Configurações', labelKey: 'nav.settings', icon: Settings, section: 'Preferências', sectionKey: 'nav.preferences' }
]

export function getPageTitle(pathname, locale = 'pt-BR') {
  const match = navigationItems.find((item) => item.path === pathname)
  return match ? translate(locale, match.labelKey) : 'DevCodes'
}
