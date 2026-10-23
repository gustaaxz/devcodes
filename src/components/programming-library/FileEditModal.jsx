import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import TextField from '../ui/TextField.jsx'
import TextAreaField from '../ui/TextAreaField.jsx'
import SelectField from '../ui/SelectField.jsx'
import Alert from '../ui/Alert.jsx'
import Spinner from '../ui/Spinner.jsx'
import { updateFileRecord } from '../../services/files/filesService.js'
import { friendlyError } from '../../utils/errors.js'
import { getExtension, getFileType, validateRename } from '../../utils/files.js'

export default function FileEditModal({ file, categories, onClose, onSaved }) {
  const [name, setName] = useState(file.original_name)
  const [description, setDescription] = useState(file.description || '')
  const [categoryId, setCategoryId] = useState(file.category_id)
  const [nameError, setNameError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    const message = validateRename(file.original_name, name)
    setNameError(message)
    if (message) return

    const trimmed = name.trim()
    const type = getFileType(trimmed)
    setSubmitting(true)
    try {
      const saved = await updateFileRecord(file.id, {
        original_name: trimmed,
        extension: getExtension(trimmed),
        mime_type: type.mime,
        description: description.trim() || null,
        category_id: categoryId
      })
      onSaved(saved)
    } catch (error) {
      setFormError(friendlyError(error, 'Não foi possível salvar as alterações.'))
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Editar detalhes do arquivo" onClose={onClose}>
      <form className="stack" onSubmit={handleSubmit} noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        <TextField
          label="Nome do arquivo"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={nameError}
          maxLength={255}
          autoFocus
        />
        <SelectField
          label="Categoria"
          options={categories.map((category) => ({ value: category.id, label: category.name }))}
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        />
        <TextAreaField
          label="Descrição (opcional)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <div className="modal__footer">
          <button type="button" className="button button--secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="button button--primary" disabled={submitting}>
            {submitting ? <Spinner size={16} /> : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
