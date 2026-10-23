import { useEffect } from 'react'

const SHORTCUTS = {
  'Ctrl+K': { description: 'Abrir busca global', action: 'openSearch' },
  'Cmd+K': { description: 'Abrir busca global', action: 'openSearch' },
  'Ctrl+N': { description: 'Nova anotação', action: 'newNote' },
  'Cmd+N': { description: 'Nova anotação', action: 'newNote' },
  'Ctrl+T': { description: 'Nova tarefa', action: 'newTask' },
  'Cmd+T': { description: 'Nova tarefa', action: 'newTask' },
  'Ctrl+E': { description: 'Novo evento', action: 'newEvent' },
  'Cmd+E': { description: 'Novo evento', action: 'newEvent' },
  'Ctrl+/': { description: 'Ver atalhos de teclado', action: 'showShortcuts' }
}

export function useKeyboardShortcuts(handlers = {}) {
  useEffect(() => {
    function handleKeyDown(event) {
      // Ignorar se está digitando em um input/textarea
      if (event.target.matches('input, textarea')) return

      // Construir a chave do atalho
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
      const modKey = isMac ? 'Cmd' : 'Ctrl'
      const shift = event.shiftKey ? 'Shift+' : ''
      const key = event.key.toUpperCase()
      const shortcutKey = `${modKey}+${shift}${key}`.replace(/\+$/, '')

      const shortcut = SHORTCUTS[shortcutKey]
      if (shortcut && handlers[shortcut.action]) {
        event.preventDefault()
        handlers[shortcut.action]()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])

  return SHORTCUTS
}
