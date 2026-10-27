import { CalendarClock, Check, Pencil, Trash2 } from 'lucide-react'
import Badge from '../ui/Badge.jsx'
import { formatDateTime } from '../../utils/dates.js'
import { PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, getLabel } from '../../utils/labels.js'
import { getDueState } from '../../utils/tasks.js'
import './TaskCard.css'

const DUE_LABELS = {
  overdue: 'Atrasada',
  soon: 'Vence em breve'
}

export default function TaskCard({ task, now, showStatusSelect = false, onToggleDone, onEdit, onDelete, onStatusChange }) {
  const dueState = getDueState(task, now)
  const done = task.status === 'done'

  return (
    <article className={`task-card task-card--${dueState}`}>
      <button
        type="button"
        className={`task-card__check${done ? ' task-card__check--done' : ''}`}
        onClick={() => onToggleDone(task)}
        aria-label={done ? 'Reabrir tarefa' : 'Concluir tarefa'}
      >
        {done && <Check size={14} strokeWidth={3} />}
      </button>

      <div className="task-card__content">
        <strong className={done ? 'task-card__title task-card__title--done' : 'task-card__title'}>{task.title}</strong>
        {task.description && <p className="task-card__description">{task.description}</p>}
        <div className="task-card__badges">
          {task.categories && <Badge color={task.categories.color}>{task.categories.name}</Badge>}
          <Badge variant={task.priority}>{getLabel(PRIORITY_OPTIONS, task.priority)}</Badge>
          {task.due_at && (
            <span className={`task-card__due task-card__due--${dueState}`}>
              <CalendarClock size={13} />
              {formatDateTime(new Date(task.due_at))}
            </span>
          )}
          {DUE_LABELS[dueState] && (
            <Badge variant={dueState === 'overdue' ? 'danger' : 'warning'}>{DUE_LABELS[dueState]}</Badge>
          )}
        </div>
        {task.tags?.length > 0 && (
          <div className="task-card__tags" aria-label="Tags da tarefa">
            {task.tags.map((tag) => (
              <span key={tag.id} className="task-card__tag" style={{ '--tag-color': tag.color || 'var(--color-accent)' }}>
                {tag.name}
              </span>
            ))}
          </div>
        )}
        {showStatusSelect && (
          <select
            className="task-card__status"
            value={task.status}
            onChange={(event) => onStatusChange(task, event.target.value)}
            aria-label="Alterar status"
          >
            {TASK_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="task-card__actions">
        <button type="button" className="icon-button" onClick={() => onEdit(task)} aria-label="Editar tarefa">
          <Pencil size={16} />
        </button>
        <button type="button" className="icon-button" onClick={() => onDelete(task)} aria-label="Excluir tarefa">
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  )
}
