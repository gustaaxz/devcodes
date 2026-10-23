import { Link } from 'react-router-dom'
import { CheckSquare, Pencil, Plus, StickyNote, Trash2 } from 'lucide-react'
import Badge from '../ui/Badge.jsx'
import { formatLongDate, formatTime, fromDateKey, isAllDayEvent } from '../../utils/dates.js'
import { EVENT_STATUS_OPTIONS, PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, getLabel } from '../../utils/labels.js'
import './DayPanel.css'

export default function DayPanel({ dateKey, events, tasks, notes, onCreateEvent, onEditEvent, onDeleteEvent }) {
  return (
    <aside className="day-panel card">
      <div className="day-panel__header">
        <h2>{formatLongDate(fromDateKey(dateKey))}</h2>
        <button type="button" className="button button--primary button--small" onClick={onCreateEvent}>
          <Plus size={14} />
          Evento
        </button>
      </div>

      <section className="day-panel__section">
        <h3>Eventos</h3>
        {events.length === 0 && <p className="day-panel__empty">Nenhum evento neste dia.</p>}
        {events.map((event) => {
          const start = new Date(event.start_at)
          const timeLabel = isAllDayEvent(event)
            ? 'Dia inteiro'
            : event.end_at
              ? `${formatTime(start)} às ${formatTime(new Date(event.end_at))}`
              : formatTime(start)
          return (
            <article key={event.id} className="day-panel__item">
              <span
                className="day-panel__bar"
                style={{ background: event.categories?.color || 'var(--color-accent)' }}
              />
              <div className="day-panel__content">
                <strong>{event.title}</strong>
                <span className="day-panel__meta">{timeLabel}</span>
                {event.description && <p>{event.description}</p>}
                <div className="day-panel__badges">
                  {event.categories && <Badge color={event.categories.color}>{event.categories.name}</Badge>}
                  <Badge variant={event.priority}>{getLabel(PRIORITY_OPTIONS, event.priority)}</Badge>
                  <Badge>{getLabel(EVENT_STATUS_OPTIONS, event.status)}</Badge>
                </div>
              </div>
              <div className="day-panel__actions">
                <button type="button" className="icon-button" onClick={() => onEditEvent(event)} aria-label="Editar evento">
                  <Pencil size={16} />
                </button>
                <button type="button" className="icon-button" onClick={() => onDeleteEvent(event)} aria-label="Excluir evento">
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          )
        })}
      </section>

      <section className="day-panel__section">
        <h3>Tarefas com prazo</h3>
        {tasks.length === 0 && <p className="day-panel__empty">Nenhuma tarefa com prazo neste dia.</p>}
        {tasks.map((task) => (
          <Link key={task.id} to="/tarefas" className="day-panel__link">
            <CheckSquare size={16} />
            <span>{task.title}</span>
            <Badge variant={task.status === 'done' ? 'success' : 'neutral'}>
              {getLabel(TASK_STATUS_OPTIONS, task.status)}
            </Badge>
          </Link>
        ))}
      </section>

      <section className="day-panel__section">
        <div className="day-panel__section-header">
          <h3>Anotações</h3>
          <Link to={`/anotacoes?nova=1&data=${dateKey}`} className="button button--secondary button--small">
            <Plus size={14} />
            Nova
          </Link>
        </div>
        {notes.length === 0 && <p className="day-panel__empty">Nenhuma anotação vinculada a este dia.</p>}
        {notes.map((note) => (
          <Link key={note.id} to={`/anotacoes?nota=${note.id}`} className="day-panel__link">
            <StickyNote size={16} />
            <span>{note.title || 'Sem título'}</span>
          </Link>
        ))}
      </section>
    </aside>
  )
}
