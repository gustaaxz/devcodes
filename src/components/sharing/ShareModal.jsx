import { useCallback, useEffect, useState } from 'react'
import { Copy, Link, Share2, Trash2, User } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Alert from '../ui/Alert.jsx'
import Spinner from '../ui/Spinner.jsx'
import TextField from '../ui/TextField.jsx'
import SelectField from '../ui/SelectField.jsx'
import {
  generateNotePublicLink,
  listNoteShares,
  revokeNoteShare,
  shareNoteWithUser,
  generateEventPublicLink,
  listEventShares,
  revokeEventShare,
  shareEventWithUser,
} from '../../services/sharing/shareService.js'
import { friendlyError } from '../../utils/errors.js'
import './ShareModal.css'

const PERMISSION_OPTIONS = [
  { value: 'view', label: 'Visualizar' },
  { value: 'edit', label: 'Editar' },
]

const TABS = [
  { id: 'users', label: 'Usuários', icon: User },
  { id: 'link', label: 'Link Público', icon: Link },
]

/**
 * ShareModal — unified for notes and events.
 * Props:
 *   resourceId  — id of the note or event
 *   resourceType — 'note' | 'event'
 *   ownerId     — current user id
 *   onClose     — callback to close
 */
export default function ShareModal({ resourceId, resourceType, ownerId, onClose }) {
  const [activeTab, setActiveTab] = useState('users')
  const [shares, setShares] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // User share form
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState('view')
  const [expiresAt, setExpiresAt] = useState('')
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState('')

  // Public link
  const [publicShare, setPublicShare] = useState(null)
  const [linkPermission, setLinkPermission] = useState('view')
  const [linkExpiresAt, setLinkExpiresAt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const isNote = resourceType === 'note'
  const listShares = isNote ? listNoteShares : listEventShares
  const revokeShare = isNote ? revokeNoteShare : revokeEventShare
  const shareWithUser = isNote ? shareNoteWithUser : shareEventWithUser
  const generatePublicLink = isNote ? generateNotePublicLink : generateEventPublicLink

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listShares(resourceId)
      setShares(data)
      const pub = data.find((s) => !s.shared_with_user_id)
      setPublicShare(pub || null)
    } catch (err) {
      setError(friendlyError(err, 'Não foi possível carregar os compartilhamentos.'))
    } finally {
      setLoading(false)
    }
  }, [listShares, resourceId])

  useEffect(() => {
    load()
  }, [load])

  async function handleShareWithUser(event) {
    event.preventDefault()
    setShareError('')
    if (!email.trim()) {
      setShareError('Informe o e-mail do usuário.')
      return
    }
    setSharing(true)
    try {
      await shareWithUser(resourceId, ownerId, email.trim(), {
        permission,
        expiresAt: expiresAt || null,
      })
      setEmail('')
      setExpiresAt('')
      await load()
    } catch (err) {
      setShareError(friendlyError(err, 'Não foi possível compartilhar.'))
    } finally {
      setSharing(false)
    }
  }

  async function handleRevoke(shareId) {
    try {
      await revokeShare(shareId)
      await load()
    } catch (err) {
      setError(friendlyError(err, 'Não foi possível revogar o compartilhamento.'))
    }
  }

  async function handleGenerateLink() {
    setGenerating(true)
    setError('')
    try {
      const share = await generatePublicLink(resourceId, ownerId, {
        permission: linkPermission,
        expiresAt: linkExpiresAt || null,
      })
      setPublicShare(share)
      await load()
    } catch (err) {
      setError(friendlyError(err, 'Não foi possível gerar o link.'))
    } finally {
      setGenerating(false)
    }
  }

  function buildPublicUrl(token) {
    return `${window.location.origin}/compartilhado/${token}`
  }

  function handleCopy(token) {
    navigator.clipboard.writeText(buildPublicUrl(token)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const userShares = shares.filter((s) => s.shared_with_user_id)

  return (
    <Modal
      title={isNote ? 'Compartilhar anotação' : 'Compartilhar evento'}
      onClose={onClose}
      wide
    >
      {error && <Alert variant="error">{error}</Alert>}

      {/* Tabs */}
      <div className="share-modal__tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`share-modal__tab${activeTab === tab.id ? ' share-modal__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', padding: '24px 0' }}>
          <Spinner label="Carregando compartilhamentos" />
        </div>
      ) : (
        <>
          {/* ── Users tab ── */}
          {activeTab === 'users' && (
            <div>
              <form className="share-modal__user-form stack" onSubmit={handleShareWithUser} noValidate>
                {shareError && <Alert variant="error">{shareError}</Alert>}
                <div className="field-row">
                  <TextField
                    label="E-mail do usuário"
                    type="email"
                    placeholder="usuario@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                  <SelectField
                    label="Permissão"
                    options={PERMISSION_OPTIONS}
                    value={permission}
                    onChange={(e) => setPermission(e.target.value)}
                  />
                </div>
                <div className="field-row">
                  <TextField
                    label="Expira em (opcional)"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      type="submit"
                      className="button button--primary button--block"
                      disabled={sharing}
                    >
                      {sharing ? <Spinner size={16} /> : <><Share2 size={16} />Compartilhar</>}
                    </button>
                  </div>
                </div>
              </form>

              {userShares.length === 0 ? (
                <p className="share-modal__empty">Nenhum usuário com acesso ainda.</p>
              ) : (
                <ul className="share-modal__list" aria-label="Lista de compartilhamentos">
                  {userShares.map((share) => (
                    <li key={share.id} className="share-modal__list-item">
                      <User size={16} color="var(--color-text-muted)" />
                      <div className="share-modal__list-item-info">
                        <span className="share-modal__list-item-label">
                          Usuário compartilhado
                        </span>
                        <span className="share-modal__list-item-meta">
                          Permissão: {share.permission === 'edit' ? 'Editar' : 'Visualizar'}
                          {share.expires_at
                            ? ` · Expira em ${new Date(share.expires_at).toLocaleDateString('pt-BR')}`
                            : ' · Sem expiração'}
                        </span>
                      </div>
                      <span className="share-modal__badge">{share.permission}</span>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => handleRevoke(share.id)}
                        aria-label="Revogar acesso"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Public link tab ── */}
          {activeTab === 'link' && (
            <div className="share-modal__link-section">
              {publicShare ? (
                <>
                  <div className="share-modal__link-box">
                    <span className="share-modal__link-url">
                      {buildPublicUrl(publicShare.share_token)}
                    </span>
                    <button
                      type="button"
                      className="button button--secondary button--small share-modal__copy-btn"
                      onClick={() => handleCopy(publicShare.share_token)}
                      aria-label="Copiar link"
                    >
                      <Copy size={14} />
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  {copied && <span className="share-modal__copied">Link copiado para a área de transferência!</span>}
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    Permissão: <strong>{publicShare.permission === 'edit' ? 'Editar' : 'Visualizar'}</strong>
                    {publicShare.expires_at
                      ? ` · Expira em ${new Date(publicShare.expires_at).toLocaleDateString('pt-BR')}`
                      : ' · Sem expiração'}
                  </p>
                  <button
                    type="button"
                    className="button button--secondary button--small"
                    style={{ alignSelf: 'flex-start' }}
                    onClick={() => handleRevoke(publicShare.id)}
                  >
                    <Trash2 size={14} />
                    Revogar link público
                  </button>
                </>
              ) : (
                <>
                  <div className="share-modal__options">
                    <SelectField
                      label="Permissão do link"
                      options={PERMISSION_OPTIONS}
                      value={linkPermission}
                      onChange={(e) => setLinkPermission(e.target.value)}
                    />
                    <TextField
                      label="Expira em (opcional)"
                      type="datetime-local"
                      value={linkExpiresAt}
                      onChange={(e) => setLinkExpiresAt(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={handleGenerateLink}
                    disabled={generating}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    {generating ? <Spinner size={16} /> : <><Link size={16} />Gerar link público</>}
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
