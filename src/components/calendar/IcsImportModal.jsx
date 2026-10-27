import Modal from '../ui/Modal.jsx'
import Alert from '../ui/Alert.jsx'
import Spinner from '../ui/Spinner.jsx'
import { isAllDayEvent } from '../../utils/dates.js'
import './IcsImportModal.css'

function formatEventDate(event) {
  const date = new Date(event.start_at)
  return new Intl.DateTimeFormat('pt-BR', isAllDayEvent(event)
    ? { dateStyle: 'medium' }
    : { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function IcsImportModal({ events, busy, error, onCancel, onConfirm }) {
  return (
    <Modal title="Importar calendário iCalendar" onClose={busy ? () => {} : onCancel}>
      <div className="stack">
        <p>{events.length} evento(s) compatível(is) encontrado(s). A importação adiciona eventos; não altera os existentes.</p>
        <ul className="ics-import-preview">
          {events.slice(0, 8).map((event, index) => (
            <li key={`${event.ical_uid || event.start_at}-${index}`}>
              <span>{event.title}</span>
              <time dateTime={event.start_at}>{formatEventDate(event)}</time>
            </li>
          ))}
          {events.length > 8 && <li className="ics-import-preview__more">E mais {events.length - 8} evento(s)…</li>}
        </ul>
        {error && <Alert variant="error">{error}</Alert>}
        <div className="modal__footer">
          <button type="button" className="button button--secondary" onClick={onCancel} disabled={busy}>Cancelar</button>
          <button type="button" className="button button--primary" onClick={onConfirm} disabled={busy}>
            {busy ? <Spinner size={16} /> : `Importar ${events.length} evento(s)`}
          </button>
        </div>
      </div>
    </Modal>
  )
}
