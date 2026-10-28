import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import FileLinkRow from '../../components/programming-library/FileLinkRow.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { useDataVersion } from '../../hooks/useDataVersion.js'
import { useLoad } from '../../hooks/useLoad.js'
import { downloadFile, updateFileRecord } from '../../services/files/filesService.js'
import { loadFavorites } from '../../services/favorites/favoritesService.js'
import { updateNote } from '../../services/notes/notesService.js'
import { formatShortDate, fromDateKey } from '../../utils/dates.js'
import { friendlyError } from '../../utils/errors.js'
import { buildSnippet } from '../../utils/text.js'
import './Favorites.css'

export default function Favorites() {
  const { version } = useDataVersion()
  const { data, loading, error, reload } = useLoad(loadFavorites, version)
  const [actionError, setActionError] = useState('')

  async function run(action, fallback) {
    setActionError('')
    try {
      await action()
    } catch (actionFailure) {
      setActionError(friendlyError(actionFailure, fallback))
    }
  }

  function removeNote(note) {
    return run(async () => {
      await updateNote(note.id, { is_favorite: false })
      reload()
    }, 'Não foi possível remover o favorito.')
  }

  function removeFile(file) {
    return run(async () => {
      await updateFileRecord(file.id, { is_favorite: false })
      reload()
    }, 'Não foi possível remover o favorito.')
  }

  function download(file) {
    return run(() => downloadFile(file), 'Não foi possível gerar o link de download.')
  }

  if (loading && !data) return <Spinner label="Carregando favoritos" />
  if (!data) return <Alert variant="error">{error || 'Não foi possível carregar os favoritos.'}</Alert>

  return (
    <div className="favorites">
      {error && <Alert variant="error">{error}</Alert>}
      {actionError && <Alert variant="error">{actionError}</Alert>}

      <section className="favorites__section">
        <h2>Anotações ({data.notes.length})</h2>
        {data.notes.length === 0 ? (
          <p className="favorites__empty">Nenhuma anotação favoritada.</p>
        ) : (
          <div className="favorites__list">
            {data.notes.map((note) => (
              <article key={note.id} className="favorites__note">
                <Link to={`/anotacoes?nota=${note.id}`} className="favorites__note-main">
                  <strong>{note.title || 'Sem título'}</strong>
                  <span>
                    {buildSnippet(note.content, 80) || 'Anotação vazia'} ·{' '}
                    {note.linked_date
                      ? formatShortDate(fromDateKey(note.linked_date))
                      : formatShortDate(new Date(note.updated_at))}
                  </span>
                </Link>
                <button
                  type="button"
                  className="icon-button favorite-star--active"
                  onClick={() => removeNote(note)}
                  aria-label="Remover dos favoritos"
                >
                  <Star size={17} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="favorites__section">
        <h2>Arquivos da biblioteca ({data.files.length})</h2>
        {data.files.length === 0 ? (
          <p className="favorites__empty">Nenhum arquivo favoritado.</p>
        ) : (
          <div className="favorites__list">
            {data.files.map((file) => (
              <FileLinkRow key={file.id} file={file} onToggleFavorite={removeFile} onDownload={download} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
