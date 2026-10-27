import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, Link2, RefreshCw, Unlink } from 'lucide-react'
import Alert from '../ui/Alert.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import SelectField from '../ui/SelectField.jsx'
import Spinner from '../ui/Spinner.jsx'
import { useLoad } from '../../hooks/useLoad.js'
import {
  beginGoogleCalendarConnection,
  createIcsCalendarFeed,
  disconnectGoogleCalendar,
  getIcsCalendarFeedStatus,
  getGoogleCalendarIntegration,
  listGoogleCalendarSyncLogs,
  listGoogleCalendars,
  selectGoogleCalendar,
  revokeIcsCalendarFeed,
  setGoogleCalendarAutoSync,
  syncGoogleCalendar
} from '../../services/calendar/googleCalendarService.js'
import { friendlyError } from '../../utils/errors.js'

function formatSyncTime(value) {
  if (!value) return 'Nunca sincronizado'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

export default function GoogleCalendarIntegration({ userId }) {
  const [searchParams] = useSearchParams()
  const integration = useLoad(() => getGoogleCalendarIntegration(userId), userId)
  const logs = useLoad(() => listGoogleCalendarSyncLogs(userId), userId)
  const feedStatus = useLoad(getIcsCalendarFeedStatus, userId)
  const [calendars, setCalendars] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [disconnectPrompt, setDisconnectPrompt] = useState(false)
  const [feedPrompt, setFeedPrompt] = useState(false)
  const [feedUrl, setFeedUrl] = useState('')
  const integrationUserId = integration.data?.user_id
  const callbackResult = searchParams.get('google_calendar')

  useEffect(() => {
    if (!integrationUserId) return
    let active = true
    listGoogleCalendars()
      .then((items) => { if (active) setCalendars(items) })
      .catch((loadError) => { if (active) setError(friendlyError(loadError, 'Não foi possível listar seus calendários Google.')) })
    return () => { active = false }
  }, [integrationUserId])

  async function handleConnect() {
    setBusy(true)
    setError('')
    try {
      const result = await beginGoogleCalendarConnection()
      window.location.assign(result.authorizationUrl)
    } catch (actionError) {
      setError(friendlyError(actionError, 'Não foi possível iniciar a conexão Google.'))
      setBusy(false)
    }
  }

  async function handleCalendarChange(event) {
    setBusy(true)
    setError('')
    try {
      await selectGoogleCalendar(event.target.value)
      await integration.reload()
      setNotice('Calendário de destino atualizado.')
    } catch (actionError) {
      setError(friendlyError(actionError, 'Não foi possível alterar o calendário.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleSync() {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await syncGoogleCalendar()
      setNotice(`${result.message} ${result.imported} recebido(s) e ${result.exported} enviado(s).`)
      await Promise.all([integration.reload(), logs.reload()])
    } catch (actionError) {
      setError(friendlyError(actionError, 'Não foi possível sincronizar com o Google Calendar.'))
      logs.reload()
    } finally {
      setBusy(false)
    }
  }

  async function handleDisconnect() {
    setBusy(true)
    setError('')
    try {
      await disconnectGoogleCalendar()
      setDisconnectPrompt(false)
      setCalendars([])
      await Promise.all([integration.reload(), logs.reload()])
      setNotice('Autorização Google revogada. Seus eventos no DevCodes foram mantidos.')
    } catch (actionError) {
      setError(friendlyError(actionError, 'Não foi possível desconectar a conta Google.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleAutoSyncChange(event) {
    const enabled = event.target.checked
    setBusy(true)
    setError('')
    try {
      await setGoogleCalendarAutoSync(enabled)
      await integration.reload()
      setNotice(enabled
        ? 'Sincronização automática ativada enquanto o DevCodes estiver aberto e online.'
        : 'Sincronização automática desativada.')
    } catch (actionError) {
      setError(friendlyError(actionError, 'Não foi possível alterar a sincronização automática.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleFeedAction() {
    setBusy(true)
    setError('')
    try {
      if (feedPrompt === 'create') {
        const result = await createIcsCalendarFeed()
        setFeedUrl(result.feedUrl)
        await feedStatus.reload()
        setNotice('Feed iCalendar público criado. Copie o link agora; por segurança ele não será mostrado novamente.')
      } else {
        await revokeIcsCalendarFeed()
        setFeedUrl('')
        await feedStatus.reload()
        setNotice('Feed público revogado.')
      }
      setFeedPrompt(false)
    } catch (actionError) {
      setError(friendlyError(actionError, 'Não foi possível atualizar o feed iCalendar.'))
    } finally {
      setBusy(false)
    }
  }

  async function copyFeedUrl() {
    try {
      await navigator.clipboard.writeText(feedUrl)
      setNotice('Link do feed copiado.')
    } catch {
      setError('Não foi possível copiar automaticamente. Selecione e copie o link manualmente.')
    }
  }

  const connected = Boolean(integration.data)
  const selectedCalendar = calendars.find((calendar) => calendar.id === integration.data?.selected_calendar_id)

  return (
    <section className="settings__section card google-calendar">
      <header>
        <h2>Google Calendar e iCalendar</h2>
        <p>Sincronize eventos manualmente com um calendário Google e importe ou exporte arquivos .ics no calendário do DevCodes.</p>
      </header>

      {integration.loading && !integration.data && <Spinner label="Carregando integração Google" />}
      {integration.error && <Alert variant="error">{integration.error}</Alert>}
      {feedStatus.error && <Alert variant="error">{feedStatus.error}</Alert>}
      {(error || (callbackResult === 'error' && 'Verifique a configuração OAuth e tente novamente.')) && (
        <Alert variant="error">{error || 'Verifique a configuração OAuth e tente novamente.'}</Alert>
      )}
      {(notice || (callbackResult === 'connected' && 'Conta Google conectada com segurança.')) && (
        <Alert variant="success">{notice || 'Conta Google conectada com segurança.'}</Alert>
      )}

      {!connected ? (
        <div className="settings__row">
          <div className="settings__row-text">
            <strong>Conta Google</strong>
            <span>O acesso é limitado a eventos e à lista de calendários. Os tokens são criptografados no servidor.</span>
          </div>
          <button type="button" className="button button--primary" onClick={handleConnect} disabled={busy || integration.loading}>
            {busy ? <Spinner size={16} /> : <Link2 size={16} />} Conectar Google
          </button>
        </div>
      ) : (
        <>
          <div className="settings__row">
            <div className="settings__row-text">
              <strong>Conectado</strong>
              <span>Última sincronização: {formatSyncTime(integration.data.last_synced_at)}</span>
            </div>
            <div className="google-calendar__actions">
              <button type="button" className="button button--primary" onClick={handleSync} disabled={busy}>
                {busy ? <Spinner size={16} /> : <RefreshCw size={16} />} Sincronizar agora
              </button>
              <button type="button" className="button button--secondary" onClick={() => setDisconnectPrompt(true)} disabled={busy}>
                <Unlink size={16} /> Desconectar
              </button>
            </div>
          </div>

          <div className="settings__row">
            <div className="settings__row-text">
              <strong>Sincronização automática</strong>
              <span>Sincroniza mudanças em tempo real enquanto o DevCodes estiver aberto e conectado à internet.</span>
            </div>
            <label className="google-calendar__toggle">
              <input type="checkbox" checked={integration.data.sync_enabled} disabled={busy} onChange={handleAutoSyncChange} />
              <span>{integration.data.sync_enabled ? 'Ativada' : 'Desativada'}</span>
            </label>
          </div>

          <div className="settings__row">
            <div className="settings__row-text">
              <strong>Calendário de destino</strong>
              <span>{selectedCalendar?.timeZone || integration.data.selected_calendar_time_zone}</span>
            </div>
            <SelectField
              aria-label="Calendário Google de destino"
              options={calendars.map((calendar) => ({ value: calendar.id, label: calendar.primary ? `${calendar.summary} (principal)` : calendar.summary }))}
              value={integration.data.selected_calendar_id}
              disabled={busy || calendars.length === 0}
              onChange={handleCalendarChange}
            />
          </div>

          <div className="google-calendar__history">
            <h3><CalendarDays size={16} /> Histórico recente</h3>
            {logs.loading && <Spinner label="Carregando histórico" />}
            {!logs.loading && (logs.data || []).length === 0 && <p>Nenhuma sincronização realizada.</p>}
            {(logs.data || []).map((log) => (
              <div className="google-calendar__log" key={log.id}>
                <span><strong>{log.status === 'success' ? 'Concluída' : log.status === 'partial' ? 'Parcial' : log.status === 'error' ? 'Falhou' : 'Em andamento'}</strong> · {formatSyncTime(log.started_at)}</span>
                <span>{log.imported_count} recebidos · {log.exported_count} enviados{log.conflict_count ? ` · ${log.conflict_count} conflito(s)` : ''}</span>
                {log.message && <p>{log.message}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="settings__row google-calendar__feed-row">
        <div className="settings__row-text">
          <strong>Feed público iCalendar</strong>
          <span>Qualquer pessoa com o link poderá ler títulos, descrições e horários dos seus eventos. Você pode revogar ou gerar outro link a qualquer momento.</span>
        </div>
        <div className="google-calendar__actions">
          {feedStatus.data?.active && <span className="google-calendar__feed-status">Ativo</span>}
          <button type="button" className="button button--secondary" onClick={() => setFeedPrompt('create')} disabled={busy || feedStatus.loading}>
            {feedStatus.data?.active ? 'Gerar novo link' : 'Criar feed'}
          </button>
          {feedStatus.data?.active && <button type="button" className="button button--danger" onClick={() => setFeedPrompt('revoke')} disabled={busy}>Revogar</button>}
        </div>
      </div>
      {feedUrl && (
        <div className="google-calendar__feed-url">
          <input className="text-field__input" aria-label="Link secreto do feed iCalendar" readOnly value={feedUrl} onFocus={(event) => event.target.select()} />
          <button type="button" className="button button--secondary" onClick={copyFeedUrl}>Copiar link</button>
        </div>
      )}

      {disconnectPrompt && (
        <ConfirmDialog
          title="Desconectar Google Calendar"
          message="A autorização e os vínculos de sincronização serão removidos. Os eventos do DevCodes permanecem na sua conta."
          confirmLabel="Desconectar"
          busy={busy}
          error={error}
          onConfirm={handleDisconnect}
          onCancel={() => setDisconnectPrompt(false)}
        />
      )}
      {feedPrompt && (
        <ConfirmDialog
          title={feedPrompt === 'create' ? 'Criar feed público' : 'Revogar feed público'}
          message={feedPrompt === 'create'
            ? 'O link funciona como uma senha: qualquer pessoa que o receber poderá ler títulos, descrições e horários dos seus eventos. Gerar outro link revoga o anterior.'
            : 'Quem usa este link perderá o acesso aos eventos do calendário.'}
          confirmLabel={feedPrompt === 'create' ? 'Gerar link público' : 'Revogar link'}
          busy={busy}
          error={error}
          onConfirm={handleFeedAction}
          onCancel={() => setFeedPrompt(false)}
        />
      )}
    </section>
  )
}
