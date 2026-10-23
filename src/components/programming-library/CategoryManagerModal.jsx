import { useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Alert from '../ui/Alert.jsx'
import PromptModal from '../ui/PromptModal.jsx'
import DeleteCategoryModal from './DeleteCategoryModal.jsx'
import {
  renameProgrammingCategory,
  swapCategoryPositions
} from '../../services/programming-categories/programmingCategoriesService.js'
import { friendlyError } from '../../utils/errors.js'
import './CategoryManagerModal.css'

export default function CategoryManagerModal({ categories, files, onClose, onChanged }) {
  const [renameTarget, setRenameTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function move(index, direction) {
    const neighbor = categories[index + direction]
    if (!neighbor) return
    setError('')
    setBusy(true)
    try {
      await swapCategoryPositions(categories[index], neighbor)
    } catch (swapError) {
      setError(friendlyError(swapError, 'Não foi possível reordenar as categorias.'))
    }
    await onChanged()
    setBusy(false)
  }

  async function handleRename(name) {
    setError('')
    try {
      await renameProgrammingCategory(renameTarget.id, name, categories)
      setRenameTarget(null)
      await onChanged()
    } catch (renameError) {
      if (renameError.code === 'DUPLICATE_CATEGORY_NAME') {
        setError(renameError.message)
      } else {
        setError(friendlyError(renameError, 'Não foi possível renomear a categoria.'))
      }
    }
  }

  async function handleDeleted() {
    setDeleteTarget(null)
    await onChanged()
  }

  return (
    <Modal title="Gerenciar categorias" onClose={onClose}>
      <div className="stack">
        {error && <Alert variant="error">{error}</Alert>}
        <ul className="category-manager">
          {categories.map((category, index) => {
            const count = files.filter((file) => file.category_id === category.id).length
            return (
              <li key={category.id} className="category-manager__item">
                <div className="category-manager__name">
                  <strong>{category.name}</strong>
                  <span>{count} arquivo(s)</span>
                </div>
                <div className="category-manager__actions">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => move(index, -1)}
                    disabled={busy || index === 0}
                    aria-label={`Mover ${category.name} para cima`}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => move(index, 1)}
                    disabled={busy || index === categories.length - 1}
                    aria-label={`Mover ${category.name} para baixo`}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setRenameTarget(category)}
                    aria-label={`Renomear ${category.name}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setDeleteTarget(category)}
                    aria-label={`Excluir ${category.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {renameTarget && (
        <PromptModal
          title="Renomear categoria"
          label="Nome"
          initialValue={renameTarget.name}
          onSubmit={handleRename}
          onClose={() => setRenameTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteCategoryModal
          category={deleteTarget}
          otherCategories={categories.filter((category) => category.id !== deleteTarget.id)}
          categoryFiles={files.filter((file) => file.category_id === deleteTarget.id)}
          onDone={handleDeleted}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </Modal>
  )
}
