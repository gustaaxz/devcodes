import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FileText, Hash, Heart, Merge, MoreHorizontal, Pencil, Plus, Save, Search, Star, Trash2, X } from 'lucide-react'
import Alert from '../../components/ui/Alert.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
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

const RESOURCE_LINKS = [
  { key: 'notes', label: 'Notas', path: '/anotacoes' },
  { key: 'tasks', label: 'Tarefas', path: '/tarefas' },
  { key: 'files', label: 'Arquivos', path: '/biblioteca' }
]

const EMPTY_TAGS = []

export default function Tags() {
  const [params] = useSearchParams()
  const tags = useLoad(listTags)
  const createInputRef = useRef(null)
  const menuRef = useRef(null)
  const [query, setQuery] = useState(() => params.get('q') || '')
  const [resource, setResource] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(TAG_COLORS[0])
  const [editingId, setEditingId] = useState(null)
  const [nameDraft, setNameDraft] = useState('')
  const [colorDraft, setColorDraft] = useState(TAG_COLORS[0])
  const [mergeTargets, setMergeTargets] = useState({})
  const [openMenuId, setOpenMenuId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const allTags = tags.data || EMPTY_TAGS
  const visibleTags = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    return allTags
      .filter((tag) => !term || tag.name.toLocaleLowerCase().includes(term))
      .filter((tag) => !favoritesOnly || tag.is_favorite)
      .filter((tag) => !resource || tag.usage[resource] > 0)
      .sort((a, b) => b.usage_count - a.usage_count || a.name.localeCompare(b.name, 'pt-BR'))
  }, [allTags, query, favoritesOnly, resource])

  const favoriteCount = allTags.filter((tag) => tag.is_favorite).length
  const associationCount = allTags.reduce((total, tag) => total + tag.usage_count, 0)
  const hasActiveFilters = Boolean(query.trim() || resource || favoritesOnly)

  useEffect(() => {
    if (!openMenuId) return undefined

    const focusFrame = window.requestAnimationFrame(() => {
      menuRef.current?.querySelector('button')?.focus()
    })
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpenMenuId(null)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenMenuId(null)
        document.getElementById(`tag-menu-trigger-${openMenuId}`)?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openMenuId])

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
    const created = await runAction(async () => {
      await createTag(newName, newColor)
      setNewName('')
    }, 'Tag criada.')
    if (created) setNewColor(TAG_COLORS[0])
  }

  function startEdit(tag) {
    setOpenMenuId(null)
    setEditingId(tag.id)
    setNameDraft(tag.name)
    setColorDraft(tag.color || TAG_COLORS[0])
  }

  async function saveEdit(tagId) {
    const saved = await runAction(() => updateTag(tagId, { name: nameDraft, color: colorDraft }), 'Tag atualizada.')
    if (saved) setEditingId(null)
  }

  async function handleFavorite(tag) {
    setOpenMenuId(null)
    await runAction(() => updateTag(tag.id, { is_favorite: !tag.is_favorite }), tag.is_favorite ? 'Tag removida das favoritas.' : 'Tag adicionada às favoritas.')
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
    if (merged) {
      setMergeTargets((current) => ({ ...current, [source.id]: '' }))
      setOpenMenuId(null)
    }
  }

  function clearFilters() {
    setQuery('')
    setResource('')
    setFavoritesOnly(false)
  }

  if (tags.loading && !tags.data) return <Spinner label="Carregando tags" />

  return (
    <div className="tags-page">
      <header className="tags-page__hero">
        <div className="tags-page__hero-copy">
          <span className="tags-page__eyebrow"><Hash size={15} /> Organização</span>
          <h1>Tags</h1>
          <p>Reúna notas, tarefas e arquivos por assunto e encontre tudo com mais rapidez.</p>
        </div>
        <div className="tags-page__metrics" aria-label="Resumo das tags">
          <div className="tags-page__metric">
            <span className="tags-page__metric-icon"><Hash size={17} /></span>
            <span><strong>{allTags.length}</strong><small>{allTags.length === 1 ? 'tag criada' : 'tags criadas'}</small></span>
          </div>
          <div className="tags-page__metric">
            <span className="tags-page__metric-icon"><Star size={17} /></span>
            <span><strong>{favoriteCount}</strong><small>{favoriteCount === 1 ? 'favorita' : 'favoritas'}</small></span>
          </div>
          <div className="tags-page__metric">
            <span className="tags-page__metric-icon"><FileText size={17} /></span>
            <span><strong>{associationCount}</strong><small>{associationCount === 1 ? 'associação' : 'associações'}</small></span>
          </div>
        </div>
      </header>

      {tags.error && <Alert variant="error">{tags.error}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}

      <form className="tags-page__create card" onSubmit={handleCreate}>
        <div className="tags-page__section-heading">
          <span className="tags-page__section-icon"><Plus size={18} /></span>
          <div>
            <h2>Criar uma tag</h2>
            <p>Escolha um nome e uma cor para identificar o assunto.</p>
          </div>
        </div>

        <div className="tags-page__create-field">
          <label htmlFor="new-tag-name">Nome da tag</label>
          <input
            ref={createInputRef}
            id="new-tag-name"
            className="text-field__input"
            value={newName}
            maxLength={40}
            required
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Ex.: Projeto, estudos, urgente"
            disabled={busy}
          />
        </div>

        <div className="tags-page__create-colors">
          <span className="tags-page__field-label">Cor</span>
          <div className="tags-page__palette" role="group" aria-label="Cores para nova tag">
            {TAG_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`tags-page__color${newColor === color ? ' tags-page__color--selected' : ''}`}
                style={{ '--swatch-color': color }}
                aria-label={`Usar cor ${color}`}
                aria-pressed={newColor === color}
                disabled={busy}
                onClick={() => setNewColor(color)}
              />
            ))}
            <label className="tags-page__custom-color" title="Escolher outra cor">
              <input
                type="color"
                value={newColor}
                onChange={(event) => setNewColor(event.target.value)}
                aria-label="Escolher cor personalizada"
                disabled={busy}
              />
              <span aria-hidden="true">+</span>
            </label>
          </div>
        </div>

        <button type="submit" className="button button--primary tags-page__create-submit" disabled={busy || !newName.trim()}>
          <Plus size={17} /> Criar tag
        </button>
      </form>

      <section className="tags-page__browse" aria-label="Tags cadastradas">
        <div className="tags-page__browse-heading">
          <div>
            <h2>Suas tags</h2>
            <p>Pesquise, filtre e gerencie suas etiquetas.</p>
          </div>
          {allTags.length > 0 && (
            <span className="tags-page__result-count" aria-live="polite">
              {visibleTags.length} de {allTags.length}
            </span>
          )}
        </div>

        <div className="tags-page__filters card" role="toolbar" aria-label="Buscar e filtrar tags">
          <label className="tags-page__search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar pelo nome..."
              aria-label="Buscar tags pelo nome"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="tags-page__resource-filter">
            <SelectField
              aria-label="Filtrar tags por recurso"
              options={RESOURCE_OPTIONS}
              value={resource}
              onChange={(event) => setResource(event.target.value)}
            />
          </div>
          <button
            type="button"
            className={`button button--secondary tags-page__favorite-filter${favoritesOnly ? ' tags-page__favorite-filter--active' : ''}`}
            onClick={() => setFavoritesOnly((current) => !current)}
            aria-pressed={favoritesOnly}
          >
            <Star size={16} /> Favoritas
            {favoriteCount > 0 && <span className="tags-page__filter-count">{favoriteCount}</span>}
          </button>
          {hasActiveFilters && (
            <button type="button" className="tags-page__clear-filters" onClick={clearFilters}>
              <X size={15} /> Limpar filtros
            </button>
          )}
        </div>

        {visibleTags.length === 0 ? (
          <div className="tags-page__empty card">
            <span className="tags-page__empty-icon">
              {allTags.length === 0 ? <Heart size={24} /> : <Search size={24} />}
            </span>
            <div>
              <span className="tags-page__eyebrow">{allTags.length === 0 ? 'Comece por aqui' : 'Busca e filtros'}</span>
              <h3>{allTags.length === 0 ? 'Seu espaço começa com uma tag' : 'Nenhuma tag encontrada'}</h3>
              <p>{allTags.length === 0
                ? 'Crie etiquetas para agrupar seus conteúdos e deixar tudo mais fácil de encontrar.'
                : 'Tente outro termo ou remova os filtros para ver todas as tags.'}</p>
            </div>
            {allTags.length === 0 ? (
              <button type="button" className="button button--primary" onClick={() => createInputRef.current?.focus()}>
                <Plus size={16} /> Criar primeira tag
              </button>
            ) : (
              <button type="button" className="button button--secondary" onClick={clearFilters}>Limpar filtros</button>
            )}
          </div>
        ) : (
          <div className="tags-page__list">
            {visibleTags.map((tag) => (
              <article
                key={tag.id}
                className={`tags-page__item card${editingId === tag.id ? ' tags-page__item--editing' : ''}`}
                style={{ '--tag-color': tag.color || TAG_COLORS[0] }}
              >
                <span className="tags-page__swatch" aria-hidden="true"><Hash size={17} /></span>
                {editingId === tag.id ? (
                  <div className="tags-page__edit">
                    <div className="tags-page__edit-name">
                      <label htmlFor={`edit-tag-${tag.id}`}>Nome</label>
                      <input
                        id={`edit-tag-${tag.id}`}
                        className="text-field__input"
                        value={nameDraft}
                        maxLength={40}
                        onChange={(event) => setNameDraft(event.target.value)}
                        aria-label={`Nome da tag ${tag.name}`}
                      />
                    </div>
                    <div className="tags-page__edit-colors">
                      <span className="tags-page__field-label">Cor</span>
                      <div className="tags-page__palette" role="group" aria-label="Cores da tag">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`tags-page__color${colorDraft === color ? ' tags-page__color--selected' : ''}`}
                            style={{ '--swatch-color': color }}
                            aria-label={`Usar cor ${color}`}
                            aria-pressed={colorDraft === color}
                            onClick={() => setColorDraft(color)}
                          />
                        ))}
                        <label className="tags-page__custom-color" title="Escolher outra cor">
                          <input type="color" value={colorDraft} onChange={(event) => setColorDraft(event.target.value)} aria-label="Cor personalizada" />
                          <span aria-hidden="true">+</span>
                        </label>
                      </div>
                    </div>
                    <div className="tags-page__edit-actions">
                      <button type="button" className="button button--primary button--small" disabled={busy || !nameDraft.trim()} onClick={() => saveEdit(tag.id)}>
                        <Save size={15} /> Salvar
                      </button>
                      <button type="button" className="button button--secondary button--small" disabled={busy} onClick={() => setEditingId(null)}>
                        <X size={15} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="tags-page__main">
                      <div className="tags-page__name-line">
                        <h3>{tag.name}</h3>
                        {tag.is_favorite && <span className="tags-page__favorite-badge"><Star size={12} fill="currentColor" /> Favorita</span>}
                      </div>
                      <div className="tags-page__usage" aria-label={`Conteúdos com a tag ${tag.name}`}>
                        {RESOURCE_LINKS.map(({ key, label, path }) => (
                          <Link key={key} to={`${path}?tag=${encodeURIComponent(tag.name)}`} className="tags-page__usage-link">
                            <span className="tags-page__usage-count">{tag.usage[key]}</span>{label}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="tags-page__actions" ref={openMenuId === tag.id ? menuRef : null}>
                      <button
                        id={`tag-menu-trigger-${tag.id}`}
                        type="button"
                        className={`icon-button tags-page__menu-trigger${openMenuId === tag.id ? ' tags-page__menu-trigger--active' : ''}`}
                        aria-label={`Ações da tag ${tag.name}`}
                        aria-expanded={openMenuId === tag.id}
                        aria-controls={`tag-actions-${tag.id}`}
                        disabled={busy}
                        onClick={() => setOpenMenuId((current) => current === tag.id ? null : tag.id)}
                      >
                        <MoreHorizontal size={19} />
                      </button>

                      {openMenuId === tag.id && (
                        <div id={`tag-actions-${tag.id}`} className="tags-page__menu" role="group" aria-label={`Ações para ${tag.name}`}>
                          <button type="button" className="tags-page__menu-action" disabled={busy} onClick={() => handleFavorite(tag)}>
                            <Star size={16} className={tag.is_favorite ? 'tags-page__star-active' : ''} />
                            {tag.is_favorite ? 'Remover das favoritas' : 'Adicionar às favoritas'}
                          </button>
                          <button type="button" className="tags-page__menu-action" disabled={busy} onClick={() => startEdit(tag)}>
                            <Pencil size={16} /> Editar nome e cor
                          </button>
                          <div className="tags-page__menu-merge">
                            <label htmlFor={`merge-tag-${tag.id}`}>Mesclar em outra tag</label>
                            <div>
                              <SelectField
                                id={`merge-tag-${tag.id}`}
                                aria-label={`Mesclar ${tag.name} em`}
                                placeholder="Escolha uma tag..."
                                options={allTags.filter((item) => item.id !== tag.id).map((item) => ({ value: item.id, label: item.name }))}
                                value={mergeTargets[tag.id] || ''}
                                onChange={(event) => setMergeTargets((current) => ({ ...current, [tag.id]: event.target.value }))}
                              />
                              <button
                                type="button"
                                className="button button--secondary button--small"
                                aria-label={`Mesclar tag ${tag.name}`}
                                disabled={busy || !mergeTargets[tag.id]}
                                onClick={() => handleMerge(tag)}
                              >
                                <Merge size={15} /> Mesclar
                              </button>
                            </div>
                          </div>
                          <div className="tags-page__menu-divider" />
                          <button type="button" className="tags-page__menu-action tags-page__menu-action--danger" disabled={busy} onClick={() => { setOpenMenuId(null); setDeleteTarget(tag) }}>
                            <Trash2 size={16} /> Excluir tag
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

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
