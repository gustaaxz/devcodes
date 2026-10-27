import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, CheckSquare, FileCode2, Folder, Search, StickyNote, Tag } from 'lucide-react'
import Spinner from '../ui/Spinner.jsx'
import { countResults, sanitizeTerm, searchAll } from '../../services/search/searchService.js'
import { formatDateTime, formatShortDate, toDateKey } from '../../utils/dates.js'
import { friendlyError } from '../../utils/errors.js'
import { formatBytes } from '../../utils/files.js'
import './SearchBox.css'

const MIN_TERM_LENGTH = 3
const DEBOUNCE_MS = 300

function buildGroups(results) {
  return [
    {
      key: 'notes',
      label: 'Anotações',
      icon: StickyNote,
      items: results.notes.map((note) => ({
        id: note.id,
        title: note.title || 'Sem título',
        detail: `Anotação · ${formatShortDate(new Date(note.updated_at))}`,
        path: `/anotacoes?nota=${note.id}`
      }))
    },
    {
      key: 'tasks',
      label: 'Tarefas',
      icon: CheckSquare,
      items: results.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        detail: task.due_at ? `Tarefa · prazo ${formatDateTime(new Date(task.due_at))}` : 'Tarefa · sem prazo',
        path: `/tarefas?tarefa=${task.id}`
      }))
    },
    {
      key: 'events',
      label: 'Eventos',
      icon: CalendarDays,
      items: results.events.map((event) => ({
        id: event.id,
        title: event.title,
        detail: `Evento · ${formatDateTime(new Date(event.start_at))}`,
        path: `/calendario?data=${toDateKey(new Date(event.start_at))}&evento=${event.id}`
      }))
    },
    {
      key: 'files',
      label: 'Arquivos',
      icon: FileCode2,
      items: results.files.map((file) => ({
        id: file.id,
        title: file.original_name,
        detail: `Arquivo · ${formatBytes(file.size_bytes)}`,
        path: `/biblioteca?arquivo=${file.id}`
      }))
    },
    {
      key: 'categories',
      label: 'Categorias',
      icon: Folder,
      items: results.categories.map((category) => ({
        id: `${category.kind}-${category.id}`,
        title: category.name,
        detail: category.kind === 'programming' ? 'Categoria da biblioteca' : 'Categoria de tarefas e eventos',
        path:
          category.kind === 'programming'
            ? `/biblioteca?aba=${category.slug}`
            : `/tarefas?categoria=${category.id}`
      }))
    },
    {
      key: 'tags',
      label: 'Tags',
      icon: Tag,
      items: results.tags.map((tag) => ({
        id: tag.id,
        title: tag.name,
        detail: 'Tag · organizar e filtrar recursos',
        path: `/tags?q=${encodeURIComponent(tag.name)}`
      }))
    }
  ].filter((group) => group.items.length > 0)
}

export default function SearchBox({ autoFocus = false, onNavigate }) {
  const navigate = useNavigate()
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [state, setState] = useState({ loading: false, error: '', groups: null })
  const timerRef = useRef(null)
  const requestRef = useRef(0)
  const containerRef = useRef(null)

  useEffect(() => {
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      clearTimeout(timerRef.current)
    }
  }, [])

  function runSearch(value) {
    const requestId = requestRef.current + 1
    requestRef.current = requestId
    searchAll(value)
      .then((results) => {
        if (requestRef.current !== requestId) return
        setState({ loading: false, error: '', groups: countResults(results) > 0 ? buildGroups(results) : [] })
      })
      .catch((error) => {
        if (requestRef.current !== requestId) return
        setState({ loading: false, error: friendlyError(error, 'Não foi possível realizar a pesquisa.'), groups: null })
      })
  }

  function handleChange(event) {
    const value = event.target.value
    setTerm(value)
    setOpen(true)
    clearTimeout(timerRef.current)
    requestRef.current += 1

    if (sanitizeTerm(value).length < MIN_TERM_LENGTH) {
      setState({ loading: false, error: '', groups: null })
      return
    }
    setState((current) => ({ ...current, loading: true, error: '' }))
    timerRef.current = setTimeout(() => runSearch(value), DEBOUNCE_MS)
  }

  function handleSelect(path) {
    setOpen(false)
    setTerm('')
    setState({ loading: false, error: '', groups: null })
    navigate(path)
    if (onNavigate) onNavigate()
  }

  const showPanel = open && sanitizeTerm(term).length >= MIN_TERM_LENGTH

  return (
    <div className="search" ref={containerRef}>
      <div className="search__field">
        <Search size={16} />
        <input
          type="search"
          placeholder="Pesquisar em tudo"
          value={term}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false)
          }}
          autoFocus={autoFocus}
          aria-label="Pesquisa global"
        />
        {state.loading && <Spinner size={14} />}
      </div>

      {showPanel && (
        <div className="search__panel" role="listbox">
          {state.error && <p className="search__message search__message--error">{state.error}</p>}
          {!state.error && !state.loading && state.groups && state.groups.length === 0 && (
            <p className="search__message">Nenhum resultado encontrado.</p>
          )}
          {!state.error && state.groups && state.groups.map((group) => {
            const Icon = group.icon
            return (
              <section key={group.key} className="search__group">
                <h3>
                  <Icon size={13} />
                  {group.label}
                </h3>
                {group.items.map((item) => (
                  <button key={item.id} type="button" className="search__item" onClick={() => handleSelect(item.path)}>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </button>
                ))}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
