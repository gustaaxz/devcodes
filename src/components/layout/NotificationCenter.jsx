import { useState } from 'react'
import { Bell, Check, Clock3, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import Alert from '../ui/Alert.jsx'
import { formatDateTime } from '../../utils/dates.js'
import { friendlyError } from '../../utils/errors.js'
import './NotificationCenter.css'

export default function NotificationCenter({
  reminders,
  toasts,
  error,
  onDismiss,
  onSnooze,
  onComplete
}) {
  const [open, setOpen] = useState(false)
  const [actionError, setActionError] = useState('')
  const unread = reminders.filter((reminder) => reminder.status === 'notified').length

  async function runAction(action) {
    setActionError('')
    try {
      await action()
    } catch (actionError) {
      setActionError(friendlyError(actionError, 'Não foi possível atualizar o lembrete.'))
    }
  }

  return (
    <>
      <div className="notification-center">
        <button
          type="button"
          className="icon-button notification-center__trigger"
          aria-label={unread ? `Notificações, ${unread} não lida(s)` : 'Notificações'}
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => setOpen((value) => !value)}
        >
          <Bell size={18} />
          {unread > 0 && <span className="notification-center__count">{unread > 99 ? '99+' : unread}</span>}
        </button>

        {open && (
          <section className="notification-center__panel" aria-label="Central de notificações">
            <header className="notification-center__header">
              <h2>Notificações</h2>
              <button type="button" className="icon-button" aria-label="Fechar notificações" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </header>
            {(error || actionError) && <Alert variant="error">{actionError || error}</Alert>}
            {reminders.length === 0 ? (
              <p className="notification-center__empty">Nenhum lembrete ativo.</p>
            ) : (
              <ul className="notification-center__list">
                {reminders.map((reminder) => (
                  <li key={reminder.id} className="notification-center__item">
                    <div className="notification-center__item-content">
                      <strong>{reminder.tasks?.title || 'Tarefa'}</strong>
                      <span>{reminder.status === 'notified' ? 'Lembrete pendente' : `Aviso: ${formatDateTime(new Date(reminder.remind_at))}`}</span>
                      <Link to={`/tarefas?tarefa=${reminder.task_id}`} onClick={() => setOpen(false)}>
                        Abrir tarefa
                      </Link>
                    </div>
                    <div className="notification-center__item-actions">
                      <button type="button" className="icon-button" aria-label="Adiar 15 minutos" onClick={() => runAction(() => onSnooze(reminder.id))}>
                        <Clock3 size={15} />
                      </button>
                      <button type="button" className="icon-button" aria-label="Dispensar lembrete" onClick={() => runAction(() => onDismiss(reminder.id))}>
                        <X size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {toasts.length > 0 && (
        <div className="reminder-toasts" aria-live="polite" aria-label="Lembretes vencidos">
          {toasts.map((reminder) => (
            <article key={reminder.id} className="reminder-toast">
              <div className="reminder-toast__copy">
                <strong>Hora de revisar uma tarefa</strong>
                <span>{reminder.tasks?.title || 'Tarefa com prazo próximo'}</span>
              </div>
              <div className="reminder-toast__actions">
                <button type="button" className="button button--secondary button--small" onClick={() => runAction(() => onSnooze(reminder.id))}>
                  <Clock3 size={14} /> Adiar 15 min
                </button>
                <button type="button" className="button button--primary button--small" onClick={() => runAction(() => onComplete(reminder))}>
                  <Check size={14} /> Concluir
                </button>
                <button type="button" className="icon-button" aria-label="Dispensar lembrete" onClick={() => runAction(() => onDismiss(reminder.id))}>
                  <X size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
