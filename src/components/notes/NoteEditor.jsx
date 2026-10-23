import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Bold, Copy, Heading2, Italic, List, Pin, Star, Trash2 } from 'lucide-react'
import TextField from '../ui/TextField.jsx'
import SelectField from '../ui/SelectField.jsx'
import Alert from '../ui/Alert.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import MarkdownPreview from './MarkdownPreview.jsx'
import TagInput from './TagInput.jsx'
import { deleteNote, duplicateNote, setNoteTags, updateNote } from '../../services/notes/notesService.js'
import { formatDateTime } from '../../utils/dates.js'
import { friendlyError } from '../../utils/errors.js'
import './NoteEditor.css'

const AUTOSAVE_DELAY = 800

const SAVE_LABELS = {
  saved: 'Salvo',
  pending: 'Alterações não salvas',
  saving: 'Salvando',
  error: 'Erro ao salvar'
}

function buildDraft(note) {
  return {
    title: note.title,
    content: note.content,
    category_id: note.category_id || '',
    linked_date: note.linked_date || ''
  }
}

function toPayload(draft) {
  return {
    title: draft.title,
    content: draft.content,
    category_id: draft.category_id || null,
    linked_date: draft.linked_date || null
  }
}

export default function NoteEditor({ note, categories, tagSuggestions, onChanged, onDeleted, onDuplicated, onBack }) {
  const [draft, setDraft] = useState(() => buildDraft(note))
  const [saveState, setSaveState] = useState('saved')
  const [mode, setMode] = useState('edit')
  const [actionError, setActionError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  const draftRef = useRef(draft)
  const timerRef = useRef(null)
  const dirtyRef = useRef(false)
  const savingRef = useRef(false)
  const rerunRef = useRef(false)
  const onChangedRef = useRef(onChanged)
  const textareaRef = useRef(null)

  useEffect(() => {
    onChangedRef.current = onChanged
  })

  const persist = useCallback(async () => {
    timerRef.current = null
    if (savingRef.current) {
      rerunRef.current = true
      return
    }
    savingRef.current = true
    const snapshot = draftRef.current
    setSaveState('saving')
    try {
      const saved = await updateNote(note.id, toPayload(snapshot))
      onChangedRef.current(saved)
      if (draftRef.current === snapshot) {
        dirtyRef.current = false
        setSaveState('saved')
      }
    } catch {
      setSaveState('error')
    } finally {
      savingRef.current = false
      if (rerunRef.current) {
        rerunRef.current = false
        persist()
      }
    }
  }, [note.id])

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (dirtyRef.current) event.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        persist()
      }
    }
  }, [persist])

  function change(patch) {
    const next = { ...draftRef.current, ...patch }
    draftRef.current = next
    dirtyRef.current = true
    setDraft(next)
    setSaveState('pending')
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(persist, AUTOSAVE_DELAY)
  }

  function applyFormat(kind) {
    const element = textareaRef.current
    if (!element) return
    const value = draftRef.current.content
    const start = element.selectionStart
    const end = element.selectionEnd
    let nextValue = value
    let selectionStart = start
    let selectionEnd = end

    if (kind === 'bold' || kind === 'italic') {
      const marker = kind === 'bold' ? '**' : '*'
      const selected = value.slice(start, end) || 'texto'
      nextValue = `${value.slice(0, start)}${marker}${selected}${marker}${value.slice(end)}`
      selectionStart = start + marker.length
      selectionEnd = selectionStart + selected.length
    } else {
      const prefix = kind === 'heading' ? '## ' : '- '
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const block = value.slice(lineStart, end)
      const prefixed = block
        .split('\n')
        .map((line) => `${prefix}${line}`)
        .join('\n')
      nextValue = `${value.slice(0, lineStart)}${prefixed}${value.slice(end)}`
      selectionStart = start + prefix.length
      selectionEnd = lineStart + prefixed.length
    }

    change({ content: nextValue })
    requestAnimationFrame(() => {
      element.focus()
      element.setSelectionRange(selectionStart, selectionEnd)
    })
  }

  async function toggleFlag(field) {
    setActionError('')
    try {
      const saved = await updateNote(note.id, { [field]: !note[field] })
      onChangedRef.current(saved)
    } catch (error) {
      setActionError(friendlyError(error, 'Não foi possível atualizar a anotação.'))
    }
  }

  async function handleTagsChange(names) {
    setActionError('')
    setBusy(true)
    try {
      const saved = await setNoteTags(note.id, names)
      onChangedRef.current(saved)
    } catch (error) {
      setActionError(friendlyError(error, 'Não foi possível atualizar as tags.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleDuplicate() {
    setActionError('')
    setBusy(true)
    try {
      const copy = await duplicateNote({ ...toPayload(draftRef.current), tags: note.tags })
      onDuplicated(copy)
    } catch (error) {
      setActionError(friendlyError(error, 'Não foi possível duplicar a anotação.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    clearTimeout(timerRef.current)
    timerRef.current = null
    dirtyRef.current = false
    setBusy(true)
    try {
      await deleteNote(note.id)
      onDeleted(note.id)
    } catch (error) {
      setActionError(friendlyError(error, 'Não foi possível excluir a anotação.'))
      setBusy(false)
    }
  }

  return (
    <section className="note-editor card">
      <div className="note-editor__header">
        <button type="button" className="icon-button note-editor__back" onClick={onBack} aria-label="Voltar para a lista">
          <ArrowLeft size={18} />
        </button>
        <span className={`note-editor__status note-editor__status--${saveState}`}>{SAVE_LABELS[saveState]}</span>
        {saveState === 'error' && (
          <button type="button" className="button button--secondary button--small" onClick={persist}>
            Tentar novamente
          </button>
        )}
        <div className="page-toolbar__spacer" />
        <button
          type="button"
          className={`icon-button${note.is_favorite ? ' icon-button--active' : ''}`}
          onClick={() => toggleFlag('is_favorite')}
          aria-label={note.is_favorite ? 'Remover dos favoritos' : 'Favoritar'}
          aria-pressed={note.is_favorite}
        >
          <Star size={18} />
        </button>
        <button
          type="button"
          className={`icon-button${note.is_pinned ? ' icon-button--active' : ''}`}
          onClick={() => toggleFlag('is_pinned')}
          aria-label={note.is_pinned ? 'Desafixar' : 'Fixar'}
          aria-pressed={note.is_pinned}
        >
          <Pin size={18} />
        </button>
        <button type="button" className="icon-button" onClick={handleDuplicate} disabled={busy} aria-label="Duplicar anotação">
          <Copy size={18} />
        </button>
        <button type="button" className="icon-button" onClick={() => setConfirmingDelete(true)} aria-label="Excluir anotação">
          <Trash2 size={18} />
        </button>
      </div>

      {actionError && <Alert variant="error">{actionError}</Alert>}

      <TextField
        label="Título"
        value={draft.title}
        onChange={(event) => change({ title: event.target.value })}
        maxLength={200}
      />

      <div className="field-row">
        <SelectField
          label="Categoria"
          placeholder="Sem categoria"
          options={categories.map((category) => ({ value: category.id, label: category.name }))}
          value={draft.category_id}
          onChange={(event) => change({ category_id: event.target.value })}
        />
        <TextField
          label="Data vinculada"
          type="date"
          value={draft.linked_date}
          onChange={(event) => change({ linked_date: event.target.value })}
        />
      </div>

      <TagInput
        tags={note.tags.map((tag) => tag.name)}
        suggestions={tagSuggestions}
        onChange={handleTagsChange}
        disabled={busy}
      />

      <div className="note-editor__body">
        <div className="note-editor__toolbar">
          <div className="segmented" role="group" aria-label="Modo do editor">
            <button
              type="button"
              className={mode === 'edit' ? 'segmented__item segmented__item--active' : 'segmented__item'}
              onClick={() => setMode('edit')}
            >
              Editar
            </button>
            <button
              type="button"
              className={mode === 'preview' ? 'segmented__item segmented__item--active' : 'segmented__item'}
              onClick={() => setMode('preview')}
            >
              Visualizar
            </button>
          </div>
          <div className="note-editor__format">
            <button type="button" className="icon-button" onClick={() => applyFormat('heading')} disabled={mode !== 'edit'} aria-label="Título">
              <Heading2 size={16} />
            </button>
            <button type="button" className="icon-button" onClick={() => applyFormat('bold')} disabled={mode !== 'edit'} aria-label="Negrito">
              <Bold size={16} />
            </button>
            <button type="button" className="icon-button" onClick={() => applyFormat('italic')} disabled={mode !== 'edit'} aria-label="Itálico">
              <Italic size={16} />
            </button>
            <button type="button" className="icon-button" onClick={() => applyFormat('list')} disabled={mode !== 'edit'} aria-label="Lista">
              <List size={16} />
            </button>
          </div>
        </div>

        {mode === 'edit' ? (
          <textarea
            ref={textareaRef}
            className="note-editor__textarea"
            value={draft.content}
            onChange={(event) => change({ content: event.target.value })}
            placeholder="Escreva sua anotação"
            aria-label="Conteúdo da anotação"
          />
        ) : (
          <div className="note-editor__preview">
            <MarkdownPreview content={draft.content} />
          </div>
        )}
      </div>

      <p className="note-editor__dates">
        Criada em {formatDateTime(new Date(note.created_at))} · Modificada em {formatDateTime(new Date(note.updated_at))}
      </p>

      {confirmingDelete && (
        <ConfirmDialog
          title="Excluir anotação"
          message="Deseja excluir esta anotação? Esta ação não pode ser desfeita."
          busy={busy}
          error={actionError}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </section>
  )
}
