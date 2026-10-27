import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  StickyNote,
  Code2,
  Clock,
  Star,
  Settings,
  Tags as TagsIcon
} from 'lucide-react'

export const navigationItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'Visão geral' },
  { path: '/calendario', label: 'Calendário', icon: CalendarDays, section: 'Organização' },
  { path: '/tarefas', label: 'Tarefas', icon: CheckSquare, section: 'Organização' },
  { path: '/anotacoes', label: 'Anotações', icon: StickyNote, section: 'Organização' },
  { path: '/biblioteca', label: 'Biblioteca de Programação', icon: Code2, section: 'Organização' },
  { path: '/arquivos-recentes', label: 'Arquivos recentes', icon: Clock, section: 'Organização' },
  { path: '/favoritos', label: 'Favoritos', icon: Star, section: 'Organização' },
  { path: '/tags', label: 'Tags', icon: TagsIcon, section: 'Organização' },
  { path: '/configuracoes', label: 'Configurações', icon: Settings, section: 'Preferências' }
]

export function getPageTitle(pathname) {
  const match = navigationItems.find((item) => item.path === pathname)
  return match ? match.label : 'DevCodes'
}
