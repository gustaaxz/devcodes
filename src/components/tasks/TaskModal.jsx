import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import TextField from '../ui/TextField.jsx'
import TextAreaField from '../ui/TextAreaField.jsx'
import SelectField from '../ui/SelectField.jsx'
import Alert from '../ui/Alert.jsx'
import Spinner from '../ui/Spinner.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useDataVersion } from '../../hooks/useDataVersion.js'
import { createTask, updateTask } from '../../services/tasks/tasksService.js'
import { toDateTimeInput } from '../../utils/dates.js'
import { PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../../utils/labels.js'
import { friendlyError } from '../../utils/errors.js'

function buildInitialValues(task) {
  if (!task) {
    return { title: '', description: '', categoryId: '', due: '', priority: 'medium', status: 'pending' }
  }
  return {
    title: task.title,
    description: task.description || '',
    categoryId: task.category_id || '',
    due: task.due_at ? toDateTimeInput(new Date(task.due_at)) : '',
    priority: task.priority,
    status: task.status
  }
}

export default function TaskModal({ task, categories, onClose, onSaved }) {
  const { user } = useAuth()
  const { bump } = useDataVersion()
  const [values, setValues] = useState(() => buildInitialValues(task))
  const [titleError, setTitleError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    if (!values.title.trim()) {
      setTitleError('Informe o título.')
      return
    }
    setTitleError('')

    let completedAt = null
    if (values.status === 'done') {
      completedAt = task?.status === 'done' && task.completed_at ? task.completed_at : new Date().toISOString()
    }

    const payload = {
      user_id: user.id,
      title: values.title.trim(),
      description: values.description.trim() || null,
      category_id: values.categoryId || null,
      due_at: values.due ? new Date(values.due).toISOString() : null,
      priority: values.priority,
      status: values.status,
      completed_at: completedAt
    }

    setSubmitting(true)
    try {
      if (task) await updateTask(task.id, payload)
      else await createTask(payload)
      bump()
      onSaved()
    } catch (error) {
      setFormError(friendlyError(error, 'Não foi possível salvar a tarefa.'))
      setSubmitting(false)
    }
  }

  return (
    <Modal title={task ? 'Editar tarefa' : 'Nova tarefa'} onClose={onClose} wide>
      <form className="stack" onSubmit={handleSubmit} noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        <TextField
          label="Título"
          value={values.title}
          onChange={(e) => setField('title', e.target.value)}
          error={titleError}
          maxLength={200}
          autoFocus
        />
        <TextAreaField
          label="Descrição"
          value={values.description}
          onChange={(e) => setField('description', e.target.value)}
        />
        <div className="field-row">
          <SelectField
            label="Categoria"
            placeholder="Sem categoria"
            options={categories.map((category) => ({ value: category.id, label: category.name }))}
            value={values.categoryId}
            onChange={(e) => setField('categoryId', e.target.value)}
          />
          <TextField
            label="Prazo (opcional)"
            type="datetime-local"
            value={values.due}
            onChange={(e) => setField('due', e.target.value)}
          />
        </div>
        <div className="field-row">
          <SelectField
            label="Prioridade"
            options={PRIORITY_OPTIONS}
            value={values.priority}
            onChange={(e) => setField('priority', e.target.value)}
          />
          <SelectField
            label="Status"
            options={TASK_STATUS_OPTIONS}
            value={values.status}
            onChange={(e) => setField('status', e.target.value)}
          />
        </div>
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
