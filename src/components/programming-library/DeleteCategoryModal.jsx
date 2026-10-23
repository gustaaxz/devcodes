import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Alert from '../ui/Alert.jsx'
import Spinner from '../ui/Spinner.jsx'
import SelectField from '../ui/SelectField.jsx'
import {
  deleteEmptyCategory,
  deleteFilesAndCategory,
  moveFilesAndDeleteCategory
} from '../../services/programming-categories/programmingCategoriesService.js'
import { friendlyError } from '../../utils/errors.js'
import './DeleteCategoryModal.css'

export default function DeleteCategoryModal({ category, otherCategories, categoryFiles, onDone, onCancel }) {
  const fileCount = categoryFiles.length
  const canMove = otherCategories.length > 0
  const [choice, setChoice] = useState(canMove ? 'move' : 'delete')
  const [targetId, setTargetId] = useState(otherCategories[0]?.id || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setError('')
    setBusy(true)
    try {
      if (fileCount === 0) await deleteEmptyCategory(category.id)
      else if (choice === 'move') await moveFilesAndDeleteCategory(category.id, targetId)
      else await deleteFilesAndCategory(category.id, categoryFiles)
      await onDone()
    } catch (deleteError) {
      setError(friendlyError(deleteError, 'Não foi possível concluir a exclusão.'))
      setBusy(false)
    }
  }

  const confirmLabel = fileCount === 0 ? 'Excluir categoria' : choice === 'move' ? 'Mover e excluir categoria' : 'Excluir tudo'

  return (
    <Modal title={`Excluir "${category.name}"`} onClose={busy ? () => {} : onCancel}>
      <div className="stack">
        {fileCount === 0 ? (
          <p>Esta categoria não possui arquivos. Deseja excluí-la?</p>
        ) : (
          <>
            <p>
              Esta categoria possui <strong>{fileCount}</strong> arquivo(s). Escolha o que fazer com eles:
            </p>
            <label className={`choice${choice === 'move' ? ' choice--active' : ''}${canMove ? '' : ' choice--disabled'}`}>
              <input
                type="radio"
                name="delete-choice"
                checked={choice === 'move'}
                onChange={() => setChoice('move')}
                disabled={!canMove || busy}
              />
              <span>
                <strong>Mover para outra categoria</strong>
                {canMove && (
                  <SelectField
                    aria-label="Categoria de destino"
                    options={otherCategories.map((item) => ({ value: item.id, label: item.name }))}
                    value={targetId}
                    onChange={(event) => setTargetId(event.target.value)}
                    disabled={choice !== 'move' || busy}
                  />
                )}
              </span>
            </label>
            <label className={`choice${choice === 'delete' ? ' choice--active' : ''}`}>
              <input
                type="radio"
                name="delete-choice"
                checked={choice === 'delete'}
                onChange={() => setChoice('delete')}
                disabled={busy}
              />
              <span>
                <strong>Excluir os arquivos permanentemente</strong>
                <small>Os arquivos serão removidos do armazenamento e esta ação não pode ser desfeita.</small>
              </span>
            </label>
          </>
        )}
        {error && <Alert variant="error">{error}</Alert>}
        <div className="modal__footer">
          <button type="button" className="button button--secondary" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="button button--danger" onClick={handleConfirm} disabled={busy}>
            {busy ? <Spinner size={16} /> : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
