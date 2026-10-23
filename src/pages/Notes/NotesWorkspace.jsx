import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, Star, StickyNote } from 'lucide-react'
import NoteEditor from '../../components/notes/NoteEditor.jsx'
import NoteList from '../../components/notes/NoteList.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import SelectField from '../../components/ui/SelectField.jsx'
import Alert from '../../components/ui/Alert.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useDataVersion } from '../../hooks/useDataVersion.js'
import { useRealtimeSync } from '../../hooks/useRealtimeSync.js'
import { createNote } from '../../services/notes/notesService.js'
import { toDateKey } from '../../utils/dates.js'
import { friendlyError } from '../../utils/errors.js'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function compareNotes(view) {
  return (a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
    if (view === 'dated' && a.linked_date !== b.linked_date) return a.linked_date < b.linked_date ? 1 : -1
    return new Date(b.updated_at) - new Date(a.updated_at)
  }
}

export default function NotesWorkspace({ initialNotes, categories }) {
  const { user } = useAuth()
  const { bump } = useDataVersion()
  const [params, setParams] = useSearchParams()
  const [notes, setNotes] = useState(initialNotes)
  const [selectedId, setSelectedId] = useState(null)
  const [view, setView] = useState('general')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [tagState, setTagState] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const handledNewRef = useRef(false)

  const noteParam = params.get('nota')
  const tagParam = params.get('tag')
  const requestedNote = notes.find((note) => note.id === noteParam) || null
  const tagMatches = tagParam ? notes.filter((note) => note.tags.some((tag) => tag.name === tagParam)) : []
  const hasParams = Boolean(noteParam || tagParam)

  let activeView = view
  if (requestedNote) activeView = requestedNote.linked_date ? 'dated' : 'general'
  else if (tagParam && tagMatches.length > 0) activeView = tagMatches.some((note) => !note.linked_date) ? 'general' : 'dated'

  function clearParams() {
    if (!hasParams) return
    setView(activeView)
    if (requestedNote) setSelectedId(requestedNote.id)
    if (tagParam !== null) setTagState(tagParam)
    setParams({}, { replace: true })
  }

  const tagFilter = tagParam !== null ? tagParam : tagState
  const effectiveSelectedId = requestedNote ? requestedNote.id : selectedId

  useEffect(() => {
    if (params.get('nova') !== '1') {
      handledNewRef.current = false
      return
    }
    if (handledNewRef.current) return
    handledNewRef.current = true
    const date = params.get('data')
    createNote({ user_id: user.id, linked_date: DATE_PATTERN.test(date || '') ? date : null })
      .then((note) => {
        setNotes((current) => [note, ...current])
        setSelectedId(note.id)
        setView(note.linked_date ? 'dated' : 'general')
        bump()
      })
      .catch((createError) => setError(friendlyError(createError, 'Não foi possível criar a anotação.')))
    setParams({}, { replace: true })
  }, [params, setParams])

  // Setup realtime sync for notes
  useRealtimeSync(
    'notes',
    { filter: `user_id=eq.${user.id}` },
    (updated) => {
      setNotes((current) =>
        current.map((note) =>
          note.id === updated.id ? { ...note, ...updated } : note
        )
      )
    },
    (deleted) => {
      setNotes((current) => current.filter((note) => note.id !== deleted.id))
    },
    (inserted) => {
      // Only add if it doesn't already exist
      setNotes((current) =>
        current.some((n) => n.id === inserted.id)
          ? current
          : [inserted, ...current]
      )
    }
  )

  const tagOptions = useMemo(() => {
    const names = new Set()
    for (const note of notes) for (const tag of note.tags) names.add(tag.name)
    return [...names].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [notes])

  const counts = useMemo(
    () => ({
      general: notes.filter((note) => !note.linked_date).length,
      dated: notes.filter((note) => note.linked_date).length
    }),
    [notes]
  )

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return notes
      .filter((note) => (activeView === 'dated' ? Boolean(note.linked_date) : !note.linked_date))
      .filter((note) => !categoryFilter || note.category_id === categoryFilter)
      .filter((note) => !tagFilter || note.tags.some((tag) => tag.name === tagFilter))
      .filter((note) => !favoritesOnly || note.is_favorite)
      .filter(
        (note) => !term || note.title.toLowerCase().includes(term) || note.content.toLowerCase().includes(term)
      )
      .sort(compareNotes(activeView))
  }, [notes, activeView, search, categoryFilter, tagFilter, favoritesOnly])

  const selected = notes.find((note) => note.id === effectiveSelectedId) || null

  function changeView(nextView) {
    clearParams()
    setView(nextView)
    setSelectedId(null)
  }

  function selectNote(id) {
    clearParams()
    setSelectedId(id)
  }

  function changeTag(value) {
    clearParams()
    setTagState(value)
  }

  function handleChanged(saved) {
    clearParams()
    setNotes((current) => current.map((note) => (note.id === saved.id ? saved : note)))
    if (saved.id === effectiveSelectedId) setView(saved.linked_date ? 'dated' : 'general')
  }

  function handleDuplicated(copy) {
    clearParams()
    setNotes((current) => [copy, ...current])
    setSelectedId(copy.id)
    setView(copy.linked_date ? 'dated' : 'general')
  }

  function handleDeleted(id) {
    clearParams()
    setNotes((current) => current.filter((note) => note.id !== id))
    setSelectedId(null)
  }

  async function handleCreate() {
    clearParams()
    setError('')
    setCreating(true)
    try {
      const note = await createNote({ user_id: user.id, linked_date: activeView === 'dated' ? toDateKey(new Date()) : null })
      setNotes((current) => [note, ...current])
      setSelectedId(note.id)
      bump()
    } catch (createError) {
      setError(friendlyError(createError, 'Não foi possível criar a anotação.'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className={`notes${selected ? ' notes--editing' : ''}`}>
      <div className="notes__sidebar">
        <div className="notes__tabs segmented" role="tablist" aria-label="Tipo de anotação">
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'general'}
            className={activeView === 'general' ? 'segmented__item segmented__item--active' : 'segmented__item'}
            onClick={() => changeView('general')}
          >
            Gerais ({counts.general})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'dated'}
            className={activeView === 'dated' ? 'segmented__item segmented__item--active' : 'segmented__item'}
            onClick={() => changeView('dated')}
          >
            Por data ({counts.dated})
          </button>
        </div>

        <button type="button" className="button button--primary button--block" onClick={handleCreate} disabled={creating}>
          <Plus size={16} />
          Nova anotação
        </button>

        <div className="notes__search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Buscar por título ou conteúdo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar anotações"
          />
        </div>

        <div className="notes__filters">
          <SelectField
            aria-label="Filtrar por categoria"
            placeholder="Todas as categorias"
            options={categories.map((category) => ({ value: category.id, label: category.name }))}
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          />
          <SelectField
            aria-label="Filtrar por tag"
            placeholder="Todas as tags"
            options={tagOptions.map((name) => ({ value: name, label: name }))}
            value={tagFilter}
            onChange={(event) => changeTag(event.target.value)}
          />
          <button
            type="button"
            className={`button button--secondary notes__favorites${favoritesOnly ? ' notes__favorites--active' : ''}`}
            onClick={() => setFavoritesOnly((value) => !value)}
            aria-pressed={favoritesOnly}
          >
            <Star size={16} />
            Favoritas
          </button>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {visible.length === 0 ? (
          <p className="notes__empty">
            {notes.length === 0 ? 'Nenhuma anotação criada ainda.' : 'Nenhuma anotação encontrada.'}
          </p>
        ) : (
          <NoteList notes={visible} selectedId={effectiveSelectedId} onSelect={selectNote} />
        )}
      </div>

      <div className="notes__editor">
        {selected ? (
          <NoteEditor
            key={selected.id}
            note={selected}
            categories={categories}
            tagSuggestions={tagOptions}
            onChanged={handleChanged}
            onDeleted={handleDeleted}
            onDuplicated={handleDuplicated}
            onBack={() => {
              clearParams()
              setSelectedId(null)
            }}
          />
        ) : (
          <EmptyState
            icon={StickyNote}
            title="Nenhuma anotação selecionada"
            description="Selecione uma anotação na lista ou crie uma nova para começar a escrever."
          />
        )}
      </div>
    </div>
  )
}
