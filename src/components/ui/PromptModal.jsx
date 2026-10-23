import { useState } from 'react'
import Modal from './Modal.jsx'
import TextField from './TextField.jsx'
import Alert from './Alert.jsx'
import Spinner from './Spinner.jsx'
import { friendlyError } from '../../utils/errors.js'

export default function PromptModal({ title, label, initialValue = '', submitLabel = 'Salvar', maxLength = 60, onSubmit, onClose }) {
  const [value, setValue] = useState(initialValue)
  const [fieldError, setFieldError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    if (!value.trim()) {
      setFieldError('Este campo é obrigatório.')
      return
    }
    setFieldError('')
    setSubmitting(true)
    try {
      await onSubmit(value.trim())
    } catch (error) {
      setFormError(friendlyError(error))
      setSubmitting(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form className="stack" onSubmit={handleSubmit} noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        <TextField
          label={label}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          error={fieldError}
          maxLength={maxLength}
          autoFocus
        />
        <div className="modal__footer">
          <button type="button" className="button button--secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="button button--primary" disabled={submitting}>
            {submitting ? <Spinner size={16} /> : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}
