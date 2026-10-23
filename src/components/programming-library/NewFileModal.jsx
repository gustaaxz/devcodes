import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import TextField from '../ui/TextField.jsx'
import SelectField from '../ui/SelectField.jsx'
import Alert from '../ui/Alert.jsx'
import Spinner from '../ui/Spinner.jsx'
import { createTextFile } from '../../services/files/filesService.js'
import { friendlyError } from '../../utils/errors.js'
import { getFileType } from '../../utils/files.js'
import './FileViewerModal.css'

export default function NewFileModal({ userId, categories, initialCategoryId, onClose, onCreated }) {
  const [categoryId, setCategoryId] = useState(initialCategoryId)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const next = {}
    const trimmed = name.trim()
    const type = getFileType(trimmed)
    if (!trimmed) next.name = 'Informe o nome do arquivo.'
    else if (/[\\/]/.test(trimmed)) next.name = 'O nome não pode conter barras.'
    else if (!type || type.kind !== 'text') next.name = 'Utilize uma extensão de texto ou código, como .js ou .py.'
    if (!content.trim()) next.content = 'O conteúdo não pode ficar vazio.'
    return next
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    const validation = validate()
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setSubmitting(true)
    try {
      const created = await createTextFile({ userId, categoryId, name: name.trim(), content })
      onCreated(created)
    } catch (error) {
      setFormError(friendlyError(error, 'Não foi possível criar o arquivo.'))
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Novo arquivo" onClose={onClose} xl>
      <form className="stack" onSubmit={handleSubmit} noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        <div className="field-row">
          <SelectField
            label="Linguagem"
            options={categories.map((category) => ({ value: category.id, label: category.name }))}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          />
          <TextField
            label="Nome do arquivo"
            placeholder="exemplo.js"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={errors.name}
            maxLength={255}
            autoFocus
          />
        </div>
        <div className="text-field">
          <label className="text-field__label" htmlFor="new-file-content">
            Conteúdo
          </label>
          <textarea
            id="new-file-content"
            className={`viewer__editor${errors.content ? ' text-field__input--error' : ''}`}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            spellCheck={false}
          />
          {errors.content && <span className="text-field__error">{errors.content}</span>}
        </div>
        <div className="modal__footer">
          <button type="button" className="button button--secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="button button--primary" disabled={submitting}>
            {submitting ? <Spinner size={16} /> : 'Criar arquivo'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
