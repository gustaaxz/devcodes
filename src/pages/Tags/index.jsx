import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Heart, Merge, Pencil, Plus, Save, Star, Trash2, X } from 'lucide-react'
import Alert from '../../components/ui/Alert.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import SelectField from '../../components/ui/SelectField.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { useLoad } from '../../hooks/useLoad.js'
import { createTag, deleteTag, listTags, mergeTags, TAG_COLORS, updateTag } from '../../services/tags/tagService.js'
import { friendlyError } from '../../utils/errors.js'
import './Tags.css'

const RESOURCE_OPTIONS = [
  { value: '', label: 'Todos os recursos' },
  { value: 'notes', label: 'Anotações' },
  { value: 'tasks', label: 'Tarefas' },
  { value: 'files', label: 'Arquivos' }
]

export default function Tags() {
  const [params] = useSearchParams()
  const tags = useLoad(listTags)
  const [query, setQuery] = useState(() => params.get('q') || '')
  const [resource, setResource] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(TAG_COLORS[0])
  const [editingId, setEditingId] = useState(null)
  const [nameDraft, setNameDraft] = useState('')
  const [colorDraft, setColorDraft] = useState(TAG_COLORS[0])
  const [mergeTargets, setMergeTargets] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const visibleTags = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    return (tags.data || [])
      .filter((tag) => !term || tag.name.toLocaleLowerCase().includes(term))
      .filter((tag) => !favoritesOnly || tag.is_favorite)
      .filter((tag) => !resource || tag.usage[resource] > 0)
      .sort((a, b) => b.usage_count - a.usage_count || a.name.localeCompare(b.name, 'pt-BR'))
  }, [tags.data, query, favoritesOnly, resource])

  async function runAction(action, successMessage = '') {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await action()
      tags.reload()
      if (successMessage) setNotice(successMessage)
      return true
    } catch (actionError) {
      setError(friendlyError(actionError, 'Não foi possível atualizar as tags.'))
      return false
    } finally {
      setBusy(false)
    }
  }

  async function handleCreate(event) {
    event.preventDefault()
    await runAction(async () => {
      await createTag(newName, newColor)
      setNewName('')
    }, 'Tag criada.')
  }

  function startEdit(tag) {
    setEditingId(tag.id)
    setNameDraft(tag.name)
    setColorDraft(tag.color || TAG_COLORS[0])
  }

  async function saveEdit(tagId) {
    const saved = await runAction(() => updateTag(tagId, { name: nameDraft, color: colorDraft }), 'Tag atualizada.')
    if (saved) setEditingId(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const deleted = await runAction(() => deleteTag(deleteTarget.id), 'Tag removida.')
    if (deleted) setDeleteTarget(null)
  }

  async function handleMerge(source) {
    const target = mergeTargets[source.id]
    if (!target) return
    const merged = await runAction(() => mergeTags(source.id, target), 'Tags mescladas.')
    if (merged) setMergeTargets((current) => ({ ...current, [source.id]: '' }))
  }

  if (tags.loading && !tags.data) return <Spinner label="Carregando tags" />

  return (
    <div className="tags-page">
      <header className="page-toolbar tags-page__header">
        <div>
          <h2>Tags</h2>
          <p>Organize anotações, tarefas e arquivos com etiquetas coloridas.</p>
        </div>
        <span className="tags-page__count">{(tags.data || []).length} tags</span>
      </header>

      {tags.error && <Alert variant="error">{tags.error}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}

      <form className="tags-page__create card" onSubmit={handleCreate}>
        <label className="tags-page__create-label" htmlFor="new-tag-name">Criar uma tag</label>
        <input
          id="new-tag-name"
          className="text-field__input"
          value={newName}
          maxLength={40}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Ex.: Projeto, estudos, urgente"
          disabled={busy}
        />
        <div className="tags-page__palette" role="group" aria-label="Cores para nova tag">
          {TAG_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`tags-page__color${newColor === color ? ' tags-page__color--selected' : ''}`}
              style={{ backgroundColor: color }}
              aria-label={`Usar cor ${color}`}
              aria-pressed={newColor === color}
              disabled={busy}
              onClick={() => setNewColor(color)}
            />
          ))}
        </div>
        <input
          type="color"
          value={newColor}
          onChange={(event) => setNewColor(event.target.value)}
          aria-label="Cor da nova tag"
          disabled={busy}
        />
        <button type="submit" className="button button--primary" disabled={busy || !newName.trim()}>
          <Plus size={16} /> Criar tag
        </button>
      </form>

      <div className="tags-page__filters">
        <input
          className="text-field__input"
          type="search"
          placeholder="Buscar tags"
          aria-label="Buscar tags"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <SelectField
          aria-label="Filtrar tags por recurso"
          options={RESOURCE_OPTIONS}
          value={resource}
          onChange={(event) => setResource(event.target.value)}
        />
        <button
          type="button"
          className={`button button--secondary${favoritesOnly ? ' tags-page__favorite--active' : ''}`}
          onClick={() => setFavoritesOnly((current) => !current)}
          aria-pressed={favoritesOnly}
        >
          <Star size={16} /> Favoritas
        </button>
      </div>

      {visibleTags.length === 0 ? (
        <EmptyState icon={Heart} title="Nenhuma tag encontrada" description="Crie uma tag ou ajuste os filtros." />
      ) : (
        <div className="tags-page__list">
          {visibleTags.map((tag) => (
            <article key={tag.id} className="tags-page__item card">
              <span className="tags-page__swatch" style={{ backgroundColor: tag.color || TAG_COLORS[0] }} aria-hidden="true" />
              {editingId === tag.id ? (
                <div className="tags-page__edit">
                  <input
                    className="text-field__input"
                    value={nameDraft}
                    maxLength={40}
                    onChange={(event) => setNameDraft(event.target.value)}
                    aria-label={`Nome da tag ${tag.name}`}
                  />
                  <div className="tags-page__palette" aria-label="Cores da tag">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`tags-page__color${colorDraft === color ? ' tags-page__color--selected' : ''}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Usar cor ${color}`}
                        aria-pressed={colorDraft === color}
                        onClick={() => setColorDraft(color)}
                      />
                    ))}
                    <input type="color" value={colorDraft} onChange={(event) => setColorDraft(event.target.value)} aria-label="Cor personalizada" />
                  </div>
                  <button type="button" className="button button--primary button--small" disabled={busy} onClick={() => saveEdit(tag.id)}>
                    <Save size={14} /> Salvar
                  </button>
                  <button type="button" className="icon-button" aria-label="Cancelar edição" onClick={() => setEditingId(null)}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="tags-page__main">
                    <strong>{tag.name}</strong>
                    <div className="tags-page__usage">
                      <Link to={`/anotacoes?tag=${encodeURIComponent(tag.name)}`}>{tag.usage.notes} anotações</Link>
                      <Link to={`/tarefas?tag=${encodeURIComponent(tag.name)}`}>{tag.usage.tasks} tarefas</Link>
                      <Link to={`/biblioteca?tag=${encodeURIComponent(tag.name)}`}>{tag.usage.files} arquivos</Link>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`icon-button${tag.is_favorite ? ' icon-button--active' : ''}`}
                    aria-label={tag.is_favorite ? `Desfavoritar tag ${tag.name}` : `Favoritar tag ${tag.name}`}
                    aria-pressed={tag.is_favorite}
                    disabled={busy}
                    onClick={() => runAction(() => updateTag(tag.id, { is_favorite: !tag.is_favorite }))}
                  >
                    <Star size={16} />
                  </button>
                  <button type="button" className="icon-button" aria-label={`Editar tag ${tag.name}`} onClick={() => startEdit(tag)}>
                    <Pencil size={16} />
                  </button>
                  <div className="tags-page__merge">
                    <SelectField
                      aria-label={`Mesclar ${tag.name} em`}
                      placeholder="Mesclar em..."
                      options={(tags.data || []).filter((item) => item.id !== tag.id).map((item) => ({ value: item.id, label: item.name }))}
                      value={mergeTargets[tag.id] || ''}
                      onChange={(event) => setMergeTargets((current) => ({ ...current, [tag.id]: event.target.value }))}
                    />
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Mesclar tag ${tag.name}`}
                      title="Mesclar"
                      disabled={busy || !mergeTargets[tag.id]}
                      onClick={() => handleMerge(tag)}
                    >
                      <Merge size={16} />
                    </button>
                  </div>
                  <button type="button" className="icon-button" aria-label={`Excluir tag ${tag.name}`} disabled={busy} onClick={() => setDeleteTarget(tag)}>
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </article>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Excluir tag"
          message={`A tag “${deleteTarget.name}” será removida de todos os recursos. Esta ação não pode ser desfeita.`}
          busy={busy}
          error={error}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
