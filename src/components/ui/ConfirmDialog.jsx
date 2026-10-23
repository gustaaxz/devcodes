import Modal from './Modal.jsx'
import Alert from './Alert.jsx'
import Spinner from './Spinner.jsx'

export default function ConfirmDialog({ title, message, confirmLabel = 'Excluir', busy, error, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={busy ? () => {} : onCancel}>
      <div className="stack">
        <p>{message}</p>
        {error && <Alert variant="error">{error}</Alert>}
        <div className="modal__footer">
          <button type="button" className="button button--secondary" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="button button--danger" onClick={onConfirm} disabled={busy}>
            {busy ? <Spinner size={16} /> : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
