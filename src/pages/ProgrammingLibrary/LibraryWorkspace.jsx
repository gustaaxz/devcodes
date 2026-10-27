import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Code2, LayoutGrid, List, Plus, Search, Star } from 'lucide-react'
import CategoryTabs from '../../components/programming-library/CategoryTabs.jsx'
import CategoryManagerModal from '../../components/programming-library/CategoryManagerModal.jsx'
import UploadDropzone from '../../components/programming-library/UploadDropzone.jsx'
import FileItem from '../../components/programming-library/FileItem.jsx'
import FileViewerModal from '../../components/programming-library/FileViewerModal.jsx'
import FileEditModal from '../../components/programming-library/FileEditModal.jsx'
import NewFileModal from '../../components/programming-library/NewFileModal.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import PromptModal from '../../components/ui/PromptModal.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import SelectField from '../../components/ui/SelectField.jsx'
import Alert from '../../components/ui/Alert.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useProfile } from '../../hooks/useProfile.js'
import { deleteFile, downloadFile, listFiles, updateFileRecord } from '../../services/files/filesService.js'
import {
  createProgrammingCategory,
  listProgrammingCategories
} from '../../services/programming-categories/programmingCategoriesService.js'
import { friendlyError } from '../../utils/errors.js'

const SORT_OPTIONS = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'modified', label: 'Modificados recentemente' },
  { value: 'name', label: 'Nome (A-Z)' },
  { value: 'size', label: 'Maior tamanho' }
]

const SORTERS = {
  recent: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  modified: (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
  name: (a, b) => a.original_name.localeCompare(b.original_name, 'pt-BR'),
  size: (a, b) => b.size_bytes - a.size_bytes
}

export default function LibraryWorkspace({ initialCategories, initialFiles }) {
  const { user } = useAuth()
  const { preferences } = useProfile()
  const [params, setParams] = useSearchParams()
  const [categories, setCategories] = useState(initialCategories)
  const [files, setFiles] = useState(initialFiles)
  const [activeId, setActiveId] = useState(initialCategories[0]?.id || null)
  const [viewerId, setViewerId] = useState(null)
  const [search, setSearch] = useState('')
  const [extensionFilter, setExtensionFilter] = useState('')
  const [tagFilter, setTagFilter] = useState(() => params.get('tag') || '')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [sort, setSort] = useState(preferences.library.sort)
  const [layout, setLayout] = useState(preferences.library.layout)
  const [error, setError] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [managing, setManaging] = useState(false)
  const [newFileOpen, setNewFileOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const fileParam = params.get('arquivo')
  const tabParam = params.get('aba')
  const tagParam = params.get('tag')
  const requestedFile = files.find((file) => file.id === fileParam) || null
  const requestedCategory = categories.find((category) => category.slug === tabParam) || null
  const taggedFile = tagParam ? files.find((file) => file.tags?.some((tag) => tag.name === tagParam)) : null

  function clearParams() {
    if (fileParam || tabParam) setParams({}, { replace: true })
  }

  const refresh = useCallback(async () => {
    try {
      const [nextCategories, nextFiles] = await Promise.all([listProgrammingCategories(), listFiles()])
      setCategories(nextCategories)
      setFiles(nextFiles)
    } catch (refreshError) {
      setError(friendlyError(refreshError, 'Não foi possível atualizar a biblioteca.'))
    }
  }, [])

  const effectiveActiveId = requestedFile
    ? requestedFile.category_id
    : requestedCategory
      ? requestedCategory.id
      : taggedFile
        ? taggedFile.category_id
        : activeId
  const active = categories.find((category) => category.id === effectiveActiveId) || categories[0] || null

  const counts = useMemo(() => {
    const result = {}
    for (const file of files) result[file.category_id] = (result[file.category_id] || 0) + 1
    return result
  }, [files])

  const categoryFiles = useMemo(
    () => tagFilter
      ? files.filter((file) => file.tags?.some((tag) => tag.name === tagFilter))
      : active ? files.filter((file) => file.category_id === active.id) : [],
    [files, active, tagFilter]
  )

  const extensionOptions = useMemo(
    () =>
      [...new Set(categoryFiles.map((file) => file.extension))]
        .sort()
        .map((extension) => ({ value: extension, label: `.${extension}` })),
    [categoryFiles]
  )

  const tagOptions = useMemo(
    () => [...new Set(categoryFiles.flatMap((file) => (file.tags || []).map((tag) => tag.name)))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((name) => ({ value: name, label: name })),
    [categoryFiles]
  )

  const visibleFiles = useMemo(() => {
    const term = search.trim().toLowerCase()
    return categoryFiles
      .filter((file) => !extensionFilter || file.extension === extensionFilter)
      .filter((file) => !tagFilter || file.tags?.some((tag) => tag.name === tagFilter))
      .filter((file) => !favoritesOnly || file.is_favorite)
      .filter(
        (file) =>
          !term ||
          file.original_name.toLowerCase().includes(term) ||
          (file.description || '').toLowerCase().includes(term)
      )
      .sort(SORTERS[sort])
  }, [categoryFiles, search, extensionFilter, tagFilter, favoritesOnly, sort])

  function selectCategory(id) {
    clearParams()
    setActiveId(id)
    setSearch('')
    setExtensionFilter('')
    setTagFilter('')
    setFavoritesOnly(false)
  }

  function replaceFile(updated) {
    setFiles((current) => current.map((file) => (file.id === updated.id ? updated : file)))
  }

  async function handleCreateCategory(name) {
    setError('')
    try {
      const created = await createProgrammingCategory(user.id, name, categories)
      await refresh()
      selectCategory(created.id)
      setCreatingCategory(false)
    } catch (createError) {
      if (createError.code === 'DUPLICATE_CATEGORY_NAME') {
        setError(createError.message)
        setCreatingCategory(true)
      } else {
        setError(friendlyError(createError, 'Não foi possível criar a categoria.'))
      }
    }
  }

  async function handleToggleFavorite(file) {
    setError('')
    try {
      replaceFile(await updateFileRecord(file.id, { is_favorite: !file.is_favorite }))
    } catch (toggleError) {
      setError(friendlyError(toggleError, 'Não foi possível atualizar o favorito.'))
    }
  }

  async function handleDownload(file) {
    setError('')
    try {
      await downloadFile(file)
    } catch (downloadError) {
      setError(friendlyError(downloadError, 'Não foi possível gerar o link de download.'))
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteFile(deleteTarget)
      setFiles((current) => current.filter((file) => file.id !== deleteTarget.id))
      if (viewerId === deleteTarget.id) setViewerId(null)
      setDeleteTarget(null)
    } catch (deleteFileError) {
      setDeleteError(friendlyError(deleteFileError, 'Não foi possível excluir o arquivo. Tente novamente.'))
    } finally {
      setDeleting(false)
    }
  }

  async function handleFileCreated(created) {
    setNewFileOpen(false)
    await refresh()
    setActiveId(created.category_id)
  }

  function handleEdited(updated) {
    replaceFile(updated)
    setEditTarget(null)
    if (updated.category_id !== activeId) setActiveId(updated.category_id)
  }

  const viewerFile = files.find((file) => file.id === viewerId) || requestedFile

  if (!active) {
    return (
      <>
        <EmptyState
          icon={Code2}
          title="Nenhuma categoria criada"
          description="Crie uma categoria para começar a organizar seus arquivos de programação."
        />
        <div className="library__empty-action">
          <button type="button" className="button button--primary" onClick={() => setCreatingCategory(true)}>
            <Plus size={16} />
            Criar categoria
          </button>
        </div>
        {creatingCategory && (
          <PromptModal
            title="Nova categoria"
            label="Nome da linguagem ou tecnologia"
            submitLabel="Criar"
            onSubmit={handleCreateCategory}
            onClose={() => setCreatingCategory(false)}
          />
        )}
      </>
    )
  }

  return (
    <div className="library">
      <CategoryTabs
        categories={categories}
        counts={counts}
        activeId={active.id}
        onSelect={selectCategory}
        onAdd={() => setCreatingCategory(true)}
        onManage={() => setManaging(true)}
      />

      <div className="page-toolbar">
        <div className="library__title">
          <h2>{tagFilter ? `Tag: ${tagFilter}` : active.name}</h2>
          <span>{categoryFiles.length} arquivo(s)</span>
        </div>
        <div className="page-toolbar__spacer" />
        <button type="button" className="button button--primary" onClick={() => setNewFileOpen(true)}>
          <Plus size={16} />
          Novo arquivo
        </button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <UploadDropzone
        key={active.id}
        userId={user.id}
        categoryId={active.id}
        categoryName={active.name}
        onUploaded={refresh}
      />

      <div className="library__filters">
        <div className="library__search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Buscar por nome ou descrição"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar arquivos"
          />
        </div>
        <SelectField
          aria-label="Filtrar por extensão"
          placeholder="Todas as extensões"
          options={extensionOptions}
          value={extensionFilter}
          onChange={(event) => setExtensionFilter(event.target.value)}
        />
        <SelectField
          aria-label="Filtrar por tag"
          placeholder="Todas as tags"
          options={tagOptions}
          value={tagFilter}
          onChange={(event) => setTagFilter(event.target.value)}
        />
        <SelectField
          aria-label="Ordenar arquivos"
          options={SORT_OPTIONS}
          value={sort}
          onChange={(event) => setSort(event.target.value)}
        />
        <button
          type="button"
          className={`button button--secondary${favoritesOnly ? ' library__favorites--active' : ''}`}
          onClick={() => setFavoritesOnly((value) => !value)}
          aria-pressed={favoritesOnly}
        >
          <Star size={16} />
          Favoritos
        </button>
        <div className="segmented" role="group" aria-label="Modo de exibição">
          <button
            type="button"
            className={layout === 'list' ? 'segmented__item segmented__item--active' : 'segmented__item'}
            onClick={() => setLayout('list')}
            aria-label="Lista"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            className={layout === 'grid' ? 'segmented__item segmented__item--active' : 'segmented__item'}
            onClick={() => setLayout('grid')}
            aria-label="Grade"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {visibleFiles.length === 0 ? (
        <p className="library__empty">
          {categoryFiles.length === 0
            ? 'Nenhum arquivo nesta categoria ainda. Envie arquivos ou crie um novo.'
            : 'Nenhum arquivo corresponde aos filtros selecionados.'}
        </p>
      ) : (
        <div className={`library__files library__files--${layout}`}>
          {visibleFiles.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              layout={layout}
              onView={(target) => setViewerId(target.id)}
              onDownload={handleDownload}
              onEdit={setEditTarget}
              onDelete={(target) => {
                setDeleteError('')
                setDeleteTarget(target)
              }}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      {viewerFile && (
        <FileViewerModal
          file={viewerFile}
          categoryName={categories.find((category) => category.id === viewerFile.category_id)?.name || ''}
          onClose={() => {
            setViewerId(null)
            clearParams()
          }}
          onDownload={handleDownload}
          onContentSaved={replaceFile}
        />
      )}

      {editTarget && (
        <FileEditModal file={editTarget} categories={categories} onClose={() => setEditTarget(null)} onSaved={handleEdited} />
      )}

      {newFileOpen && (
        <NewFileModal
          userId={user.id}
          categories={categories}
          initialCategoryId={active.id}
          onClose={() => setNewFileOpen(false)}
          onCreated={handleFileCreated}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Excluir arquivo"
          message={`Deseja excluir "${deleteTarget.original_name}"? O arquivo será removido permanentemente do armazenamento.`}
          busy={deleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {creatingCategory && (
        <PromptModal
          title="Nova categoria"
          label="Nome da linguagem ou tecnologia"
          submitLabel="Criar"
          onSubmit={handleCreateCategory}
          onClose={() => setCreatingCategory(false)}
        />
      )}

      {managing && (
        <CategoryManagerModal categories={categories} files={files} onClose={() => setManaging(false)} onChanged={refresh} />
      )}
    </div>
  )
}
