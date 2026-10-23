import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus, CheckSquare, Plus, StickyNote } from 'lucide-react'
import EventModal from '../calendar/EventModal.jsx'
import TaskModal from '../tasks/TaskModal.jsx'
import Alert from '../ui/Alert.jsx'
import { useDataVersion } from '../../hooks/useDataVersion.js'
import { listCategories } from '../../services/categories/categoriesService.js'
import { toDateKey } from '../../utils/dates.js'
import { friendlyError } from '../../utils/errors.js'
import './QuickCreateMenu.css'

export default function QuickCreateMenu({ compact = false, label = 'Criar' }) {
  const navigate = useNavigate()
  const { bump } = useDataVersion()
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const [categories, setCategories] = useState([])
  const [defaultDateKey, setDefaultDateKey] = useState('')
  const [error, setError] = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false)
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  async function openModal(kind) {
    setOpen(false)
    setError('')
    try {
      setCategories(await listCategories())
      setDefaultDateKey(toDateKey(new Date()))
      setModal(kind)
    } catch (loadError) {
      setError(friendlyError(loadError, 'Não foi possível carregar as categorias.'))
    }
  }

  function handleNote() {
    setOpen(false)
    navigate('/anotacoes?nova=1')
  }

  function handleSaved() {
    setModal(null)
    bump()
  }

  return (
    <div className="quick-create" ref={containerRef}>
      <button
        type="button"
        className="button button--primary"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Plus size={16} />
        {!compact && <span>{label}</span>}
      </button>

      {open && (
        <div className="quick-create__panel" role="menu">
          <button type="button" role="menuitem" onClick={() => openModal('task')}>
            <CheckSquare size={16} />
            Nova tarefa
          </button>
          <button type="button" role="menuitem" onClick={() => openModal('event')}>
            <CalendarPlus size={16} />
            Novo evento
          </button>
          <button type="button" role="menuitem" onClick={handleNote}>
            <StickyNote size={16} />
            Nova anotação
          </button>
        </div>
      )}

      {error && (
        <div className="quick-create__error">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {modal === 'task' && (
        <TaskModal task={null} categories={categories} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal === 'event' && (
        <EventModal
          event={null}
          defaultDateKey={defaultDateKey}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
