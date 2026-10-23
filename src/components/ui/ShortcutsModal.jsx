import { X } from 'lucide-react'
import Modal from './Modal.jsx'
import './ShortcutsModal.css'

const SHORTCUTS = [
  { keys: ['Ctrl+K', 'Cmd+K'], description: 'Abrir busca global' },
  { keys: ['Ctrl+N', 'Cmd+N'], description: 'Nova anotação' },
  { keys: ['Ctrl+T', 'Cmd+T'], description: 'Nova tarefa' },
  { keys: ['Ctrl+E', 'Cmd+E'], description: 'Novo evento' },
  { keys: ['Ctrl+/', 'Cmd+/'], description: 'Ver atalhos de teclado' }
]

export default function ShortcutsModal({ onClose }) {
  return (
    <Modal title="Atalhos de teclado" onClose={onClose}>
      <div className="shortcuts-modal">
        <ul className="shortcuts-list">
          {SHORTCUTS.map((shortcut, index) => (
            <li key={index} className="shortcuts-item">
              <div className="shortcuts-keys">
                {shortcut.keys.map((key, i) => (
                  <span key={i} className="shortcut-key">
                    {key}
                  </span>
                ))}
              </div>
              <span className="shortcuts-description">{shortcut.description}</span>
            </li>
          ))}
        </ul>
        <p className="shortcuts-hint">
          💡 Dica: Os atalhos funcionam em qualquer lugar, exceto quando você está digitando
        </p>
      </div>
    </Modal>
  )
}
