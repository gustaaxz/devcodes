import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Calendar, Clock, Copy, Share2, User } from 'lucide-react'
import Spinner from '../../components/ui/Spinner.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Badge from '../../components/ui/Badge.jsx'
import MarkdownPreview from '../../components/notes/MarkdownPreview.jsx'
import { getSharedEvent, getSharedNote, copySharedNoteToLibrary } from '../../services/sharing/shareService.js'
import { useAuth } from '../../hooks/useAuth.js'
import { formatDateTime } from '../../utils/dates.js'
import { friendlyError } from '../../utils/errors.js'
import './SharedResource.css'

export default function SharedResource() {
  const { share_token, token } = useParams()
  const activeToken = share_token || token
  const navigate = useNavigate()
  const { user } = useAuth()

  const [resource, setResource] = useState(null)
  const [type, setType] = useState(null) // 'note' | 'event'
  const [loading, setLoading] = useState(() => Boolean(activeToken))
  const [error, setError] = useState(() => (activeToken ? '' : 'Token de compartilhamento inválido.'))
  const [copying, setCopying] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (!activeToken) return

    let cancelled = false

    async function fetchResource() {
      setLoading(true)
      setError('')
      try {
        // Try note first
        try {
          const noteData = await getSharedNote(activeToken)
          if (!cancelled && noteData && noteData.note) {
            setResource(noteData)
            setType('note')
            setLoading(false)
            return
          }
        } catch (err) {
          if (err.message === 'Este link de compartilhamento expirou.') throw err
        }

        // Try event
        const eventData = await getSharedEvent(activeToken)
        if (!cancelled) {
          if (eventData && eventData.event) {
            setResource(eventData)
            setType('event')
          } else {
            setError('Recurso compartilhado não encontrado.')
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(friendlyError(err, 'Não foi possível carregar o item compartilhado.'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchResource()
    return () => {
      cancelled = true
    }
  }, [activeToken])

  async function handleCopyToLibrary() {
    if (!user) {
      navigate('/entrar', { state: { returnTo: window.location.pathname } })
      return
    }

    setCopying(true)
    try {
      await copySharedNoteToLibrary(resource.note, user.id)
      setCopySuccess(true)
      setTimeout(() => {
        navigate('/anotacoes')
      }, 1200)
    } catch (err) {
      setError(friendlyError(err, 'Não foi possível copiar para sua biblioteca.'))
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="shared-page">
      <header className="shared-page__header">
        <Link to="/" className="shared-page__logo">
          <Share2 size={20} />
          <span>DevCodes</span>
        </Link>
        <div>
          {user ? (
            <Link to="/" className="button button--secondary button--small">
              Ir para o Dashboard
            </Link>
          ) : (
            <Link to="/entrar" className="button button--primary button--small">
              Entrar / Cadastrar
            </Link>
          )}
        </div>
      </header>

      <main className="shared-page__container">
        {loading && (
          <div style={{ display: 'grid', placeItems: 'center', padding: '60px 0' }}>
            <Spinner label="Carregando recurso compartilhado" />
          </div>
        )}

        {error && (
          <div className="card shared-page__empty-card">
            <Alert variant="error">{error}</Alert>
            <Link to="/" className="button button--secondary">
              Voltar ao início
            </Link>
          </div>
        )}

        {!loading && !error && resource && type === 'note' && (
          <article className="card shared-card">
            <div className="shared-card__top">
              <div className="shared-card__title-area">
                <h1 className="shared-card__title">{resource.note.title || 'Sem título'}</h1>
                <div className="shared-card__meta">
                  <span className="shared-card__author">
                    <User size={14} />
                    {resource.author?.name || 'Autor'}
                  </span>
                  <span>
                    <Clock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {formatDateTime(new Date(resource.note.updated_at))}
                  </span>
                  <Badge variant="accent">
                    {resource.permission === 'edit' ? 'Permissão: Edição' : 'Permissão: Visualização'}
                  </Badge>
                </div>
              </div>
              <button
                type="button"
                className="button button--primary"
                onClick={handleCopyToLibrary}
                disabled={copying || copySuccess}
              >
                {copying ? (
                  <Spinner size={16} />
                ) : copySuccess ? (
                  'Copiado com sucesso!'
                ) : (
                  <>
                    <Copy size={16} />
                    Copiar para Minha Biblioteca
                  </>
                )}
              </button>
            </div>

            <div className="shared-card__content">
              <MarkdownPreview content={resource.note.content || ''} />
            </div>
          </article>
        )}

        {!loading && !error && resource && type === 'event' && (
          <article className="card shared-card">
            <div className="shared-card__top">
              <div className="shared-card__title-area">
                <h1 className="shared-card__title">{resource.event.title}</h1>
                <div className="shared-card__meta">
                  <span className="shared-card__author">
                    <User size={14} />
                    {resource.author?.name || 'Autor'}
                  </span>
                  <span>
                    <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {formatDateTime(new Date(resource.event.start_at))}
                    {resource.event.end_at && ` - ${formatDateTime(new Date(resource.event.end_at))}`}
                  </span>
                  <Badge variant={resource.event.priority}>{resource.event.priority}</Badge>
                </div>
              </div>
            </div>

            {resource.event.description && (
              <div className="shared-card__content">
                <p>{resource.event.description}</p>
              </div>
            )}
          </article>
        )}
      </main>
    </div>
  )
}
