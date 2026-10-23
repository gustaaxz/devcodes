import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import TextField from '../ui/TextField.jsx'
import TextAreaField from '../ui/TextAreaField.jsx'
import SelectField from '../ui/SelectField.jsx'
import Alert from '../ui/Alert.jsx'
import Spinner from '../ui/Spinner.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { createEvent, updateEvent } from '../../services/events/eventsService.js'
import { combineDateTime, isAllDayEvent, toDateKey, toDateTimeInput, toTimeInput } from '../../utils/dates.js'
import { EVENT_STATUS_OPTIONS, PRIORITY_OPTIONS } from '../../utils/labels.js'
import { friendlyError } from '../../utils/errors.js'

function buildInitialValues(event, defaultDateKey) {
  if (!event) {
    return {
      title: '',
      description: '',
      categoryId: '',
      date: defaultDateKey,
      startTime: '',
      endTime: '',
      priority: 'medium',
      status: 'scheduled',
      reminder: ''
    }
  }
  const start = new Date(event.start_at)
  const allDay = isAllDayEvent(event)
  return {
    title: event.title,
    description: event.description || '',
    categoryId: event.category_id || '',
    date: toDateKey(start),
    startTime: allDay ? '' : toTimeInput(start),
    endTime: event.end_at ? toTimeInput(new Date(event.end_at)) : '',
    priority: event.priority,
    status: event.status,
    reminder: event.reminder_at ? toDateTimeInput(new Date(event.reminder_at)) : ''
  }
}

export default function EventModal({ event, defaultDateKey, categories, onClose, onSaved }) {
  const { user } = useAuth()
  const [values, setValues] = useState(() => buildInitialValues(event, defaultDateKey))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function validate() {
    const next = {}
    if (!values.title.trim()) next.title = 'Informe o título.'
    if (!values.date) next.date = 'Informe a data.'
    if (values.endTime && !values.startTime) next.endTime = 'Informe o horário de início.'
    if (values.date && values.startTime && values.endTime) {
      const start = combineDateTime(values.date, values.startTime)
      const end = combineDateTime(values.date, values.endTime)
      if (end < start) next.endTime = 'O término deve ser posterior ao início.'
    }
    return next
  }

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault()
    setFormError('')
    const validation = validate()
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    const start = combineDateTime(values.date, values.startTime)
    const end = values.endTime ? combineDateTime(values.date, values.endTime) : null
    const payload = {
      user_id: user.id,
      title: values.title.trim(),
      description: values.description.trim() || null,
      category_id: values.categoryId || null,
      start_at: start.toISOString(),
      end_at: end ? end.toISOString() : null,
      priority: values.priority,
      status: values.status,
      reminder_at: values.reminder ? new Date(values.reminder).toISOString() : null
    }

    setSubmitting(true)
    try {
      if (event) await updateEvent(event.id, payload)
      else await createEvent(payload)
      onSaved()
    } catch (error) {
      setFormError(friendlyError(error, 'Não foi possível salvar o evento.'))
      setSubmitting(false)
    }
  }

  return (
    <Modal title={event ? 'Editar evento' : 'Novo evento'} onClose={onClose} wide>
      <form className="stack" onSubmit={handleSubmit} noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        <TextField
          label="Título"
          value={values.title}
          onChange={(e) => setField('title', e.target.value)}
          error={errors.title}
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
            label="Data"
            type="date"
            value={values.date}
            onChange={(e) => setField('date', e.target.value)}
            error={errors.date}
          />
        </div>
        <div className="field-row">
          <TextField
            label="Início (opcional)"
            type="time"
            value={values.startTime}
            onChange={(e) => setField('startTime', e.target.value)}
          />
          <TextField
            label="Término (opcional)"
            type="time"
            value={values.endTime}
            onChange={(e) => setField('endTime', e.target.value)}
            error={errors.endTime}
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
            options={EVENT_STATUS_OPTIONS}
            value={values.status}
            onChange={(e) => setField('status', e.target.value)}
          />
        </div>
        <TextField
          label="Lembrete (opcional)"
          type="datetime-local"
          value={values.reminder}
          onChange={(e) => setField('reminder', e.target.value)}
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
