import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import TextField from '../ui/TextField.jsx'
import TextAreaField from '../ui/TextAreaField.jsx'
import SelectField from '../ui/SelectField.jsx'
import Alert from '../ui/Alert.jsx'
import Spinner from '../ui/Spinner.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useDataVersion } from '../../hooks/useDataVersion.js'
import { createTask, updateTask } from '../../services/tasks/tasksService.js'
import {
  getReminderForTask,
  getReminderPreferences,
  REMINDER_OFFSET_OPTIONS,
  removeTaskReminder,
  setTaskReminder
} from '../../services/reminders/reminderService.js'
import { toDateTimeInput } from '../../utils/dates.js'
import { PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../../utils/labels.js'
import { friendlyError } from '../../utils/errors.js'
import './TaskModal.css'

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
  const userId = user.id
  const taskId = task?.id
  const { bump } = useDataVersion()
  const [savedTask, setSavedTask] = useState(task)
  const [values, setValues] = useState(() => buildInitialValues(task))
  const [reminder, setReminder] = useState({ enabled: false, offsetMinutes: 15, exists: false, loading: true })
  const [titleError, setTitleError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    Promise.all([
      getReminderPreferences(userId),
      taskId ? getReminderForTask(taskId, userId) : Promise.resolve(null)
    ])
      .then(([preferences, existing]) => {
        if (!active) return
        setReminder({
          enabled: Boolean(existing && existing.status !== 'dismissed'),
          offsetMinutes: existing?.offset_minutes ?? preferences.default_offset_minutes,
          exists: Boolean(existing),
          loading: false
        })
      })
      .catch(() => {
        if (active) setReminder((current) => ({ ...current, loading: false }))
      })

    return () => { active = false }
  }, [taskId, userId])

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
    let taskWasPersisted = false
    try {
      const persistedTask = savedTask
        ? await updateTask(savedTask.id, payload)
        : await createTask(payload)
      taskWasPersisted = true
      setSavedTask(persistedTask)

      if (reminder.enabled && payload.status !== 'done') {
        await setTaskReminder({
          taskId: persistedTask.id,
          userId,
          dueAt: payload.due_at,
          offsetMinutes: reminder.offsetMinutes
        })
      } else if (reminder.exists) {
        await removeTaskReminder(persistedTask.id, userId)
      }

      bump()
      onSaved()
    } catch (error) {
      const fallback = taskWasPersisted
        ? 'A tarefa foi salva, mas não foi possível salvar o lembrete.'
        : 'Não foi possível salvar a tarefa.'
      setFormError(friendlyError(error, fallback))
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
        <fieldset className="task-reminder">
          <legend>Lembrete</legend>
          <label className="task-reminder__toggle">
            <input
              type="checkbox"
              checked={reminder.enabled}
              disabled={reminder.loading || !values.due}
              onChange={(event) => setReminder((current) => ({ ...current, enabled: event.target.checked }))}
            />
            <span>Receber lembrete antes do prazo</span>
          </label>
          {reminder.enabled && (
            <SelectField
              label="Avisar"
              options={REMINDER_OFFSET_OPTIONS}
              value={String(reminder.offsetMinutes)}
              onChange={(event) => setReminder((current) => ({ ...current, offsetMinutes: Number(event.target.value) }))}
            />
          )}
          {!values.due && <p className="task-reminder__hint">Adicione um prazo para configurar um lembrete.</p>}
          {reminder.loading && <p className="task-reminder__hint">Carregando configuração do lembrete…</p>}
        </fieldset>
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
