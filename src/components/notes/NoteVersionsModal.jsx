import { useEffect, useState } from 'react'
import { RotateCcw, Clock } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Spinner from '../ui/Spinner.jsx'
import Alert from '../ui/Alert.jsx'
import { listNoteVersions, restoreNoteVersion } from '../../services/notes/noteVersionsService.js'
import { formatDateTime } from '../../utils/dates.js'
import { friendlyError } from '../../utils/errors.js'
import './NoteVersionsModal.css'

export default function NoteVersionsModal({ noteId, onClose, onRestored }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [restoring, setRestoring] = useState(null)

  useEffect(() => {
    setLoading(true)
    listNoteVersions(noteId)
      .then(setVersions)
      .catch((err) => setError(friendlyError(err, 'Não foi possível carregar o histórico.')))
      .finally(() => setLoading(false))
  }, [noteId])

  async function handleRestore(versionId) {
    setError('')
    setRestoring(versionId)
    try {
      const restored = await restoreNoteVersion(noteId, versionId)
      onRestored(restored)
      onClose()
    } catch (err) {
      setError(friendlyError(err, 'Não foi possível restaurar esta versão.'))
      setRestoring(null)
    }
  }

  return (
    <Modal title="Histórico de versões" onClose={onClose} wide>
      <div className="note-versions">
        {error && <Alert variant="error">{error}</Alert>}

        {loading ? (
          <div className="note-versions__loading">
            <Spinner label="Carregando histórico" />
          </div>
        ) : versions.length === 0 ? (
          <p className="note-versions__empty">Nenhuma versão anterior encontrada.</p>
        ) : (
          <ul className="note-versions__list">
            {versions.map((version) => (
              <li key={version.id} className="note-versions__item">
                <div className="note-versions__info">
                  <div className="note-versions__title">{version.title || 'Sem título'}</div>
                  <div className="note-versions__date">
                    <Clock size={14} />
                    {formatDateTime(new Date(version.created_at))}
                  </div>
                  <div className="note-versions__preview">
                    {version.content.slice(0, 120)}
                    {version.content.length > 120 ? '…' : ''}
                  </div>
                </div>
                <button
                  type="button"
                  className="button button--secondary button--small"
                  onClick={() => handleRestore(version.id)}
                  disabled={restoring === version.id}
                >
                  {restoring === version.id ? (
                    <Spinner size={14} />
                  ) : (
                    <>
                      <RotateCcw size={14} />
                      Restaurar
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
