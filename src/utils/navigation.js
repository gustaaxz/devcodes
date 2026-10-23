import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  StickyNote,
  Code2,
  Clock,
  Star,
  Settings
} from 'lucide-react'

export const navigationItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/calendario', label: 'Calendário', icon: CalendarDays },
  { path: '/tarefas', label: 'Tarefas', icon: CheckSquare },
  { path: '/anotacoes', label: 'Anotações', icon: StickyNote },
  { path: '/biblioteca', label: 'Biblioteca de Programação', icon: Code2 },
  { path: '/arquivos-recentes', label: 'Arquivos recentes', icon: Clock },
  { path: '/favoritos', label: 'Favoritos', icon: Star },
  { path: '/configuracoes', label: 'Configurações', icon: Settings }
]

export function getPageTitle(pathname) {
  const match = navigationItems.find((item) => item.path === pathname)
  return match ? match.label : 'DevCodes'
}
