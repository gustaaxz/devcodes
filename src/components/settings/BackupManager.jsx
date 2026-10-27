import { useMemo, useState } from 'react'
import { Download, RefreshCw, RotateCcw } from 'lucide-react'
import Alert from '../ui/Alert.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import Spinner from '../ui/Spinner.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useDataVersion } from '../../hooks/useDataVersion.js'
import { useLoad } from '../../hooks/useLoad.js'
import { createBackup, downloadBackup, listBackups, prepareBackupRestore, saveBackupPreferences } from '../../services/backups/backupService.js'
import { importDataRecords } from '../../services/import/importService.js'
import { formatBytes } from '../../utils/files.js'
import { friendlyError } from '../../utils/errors.js'
import './BackupManager.css'

const ENTITY_LABELS = { notes: 'Anotação', tasks: 'Tarefa', events: 'Evento', stored_files: 'Arquivo' }
const FIELD_LABELS = { title: 'título', original_name: 'nome do arquivo', status: 'status', priority: 'prioridade', due_at: 'prazo', start_at: 'início', end_at: 'término', is_favorite: 'favorito', is_pinned: 'fixação', category_id: 'categoria', description: 'descrição', content: 'conteúdo' }

function summarizeChange(change) {
  const oldValues = change.old_values || {}
  const newValues = change.new_values || {}
  const source = change.operation === 'DELETE' ? oldValues : newValues
  const title = source.title || source.original_name || source.name || ''
  if (change.operation !== 'UPDATE') return title ? `“${title}”` : 'Registro'
  const changedFields = Object.keys(FIELD_LABELS).filter((key) => JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key]))
  return changedFields.length ? `Alterou ${changedFields.map((field) => FIELD_LABELS[field]).join(', ')}` : 'Registro atualizado'
}

export default function BackupManager() {
  const { user } = useAuth()
  const { bump } = useDataVersion()
  const loader = useMemo(() => listBackups, [])
  const { data, loading, error, reload } = useLoad(loader)
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState(null)
  const [restoreBusy, setRestoreBusy] = useState(false)
  const [changeFilter, setChangeFilter] = useState('all')

  async function updatePreferences(patch) {
    setBusy(true)
    setNotice(null)
    try {
      await saveBackupPreferences({ ...data.preferences, ...patch })
      await reload()
    } catch (saveError) {
      setNotice({ variant: 'error', text: friendlyError(saveError, 'Não foi possível salvar a preferência.') })
    } finally { setBusy(false) }
  }

  async function runBackup() {
    setBusy(true)
    setNotice(null)
    try {
      await createBackup()
      setNotice({ variant: 'success', text: 'Backup criado e armazenado com segurança.' })
      await reload()
    } catch (backupError) {
      setNotice({ variant: 'error', text: friendlyError(backupError, 'Não foi possível criar o backup.') })
    } finally { setBusy(false) }
  }

  async function handleDownload(id) {
    try { await downloadBackup(id) }
    catch (downloadError) { setNotice({ variant: 'error', text: friendlyError(downloadError, 'Não foi possível baixar o backup.') }) }
  }

  async function handlePrepareRestore(backup) {
    setBusy(true)
    setNotice(null)
    try {
      const preview = await prepareBackupRestore(backup.id)
      setRestoreTarget({ backup, preview })
    } catch (restoreError) {
      setNotice({ variant: 'error', text: friendlyError(restoreError, 'Não foi possível preparar a restauração.') })
    } finally { setBusy(false) }
  }

  async function handleRestore() {
    if (!restoreTarget) return
    setRestoreBusy(true)
    setNotice(null)
    try {
      const result = await importDataRecords(restoreTarget.preview.records, user.id)
      const total = Object.values(result.imported).reduce((sum, count) => sum + count, 0)
      if (total > 0) bump()
      const details = `${result.imported.notes} notas, ${result.imported.tasks} tarefas e ${result.imported.events} eventos adicionados.`
      setNotice({ variant: result.errors.length ? 'info' : 'success', text: result.errors.length ? `Restauração parcial: ${details} ${result.errors.length} erro(s).` : `Restauração concluída: ${details}` })
      setRestoreTarget(null)
      await reload()
    } catch (restoreError) {
      setNotice({ variant: 'error', text: friendlyError(restoreError, 'Não foi possível restaurar o backup.') })
    } finally { setRestoreBusy(false) }
  }

  return <div className="backup-manager">
    {notice && <Alert variant={notice.variant}>{notice.text}</Alert>}
    {error && <Alert variant="error">{error}</Alert>}
    {loading && !data && <Spinner label="Carregando backups" />}
    {data && <>
      <div className="backup-manager__controls">
        <label><input type="checkbox" checked={data.preferences.automatic_enabled} disabled={busy} onChange={(event) => updatePreferences({ automatic_enabled: event.target.checked })} /> Backup automático diário</label>
        <label>Retenção <select value={data.preferences.retention_days} disabled={busy} onChange={(event) => updatePreferences({ retention_days: Number(event.target.value) })}><option value="7">7 dias</option><option value="30">30 dias</option><option value="90">90 dias</option></select></label>
        <button type="button" className="button button--primary button--small" onClick={runBackup} disabled={busy}>{busy ? <Spinner size={14} /> : <RefreshCw size={14} />}Criar backup agora</button>
      </div>
      <p className="backup-manager__hint">Os arquivos são comprimidos e mantidos em armazenamento privado. O backup automático começa após o agendador do Supabase ser configurado.</p>
      <h3>Backups recentes</h3>
      {data.backups.length ? <ul className="backup-manager__list">{data.backups.map((backup) => <li key={backup.id}>
        <span><strong>{backup.file_name}</strong><small>{new Date(backup.created_at).toLocaleString('pt-BR')} · {formatBytes(backup.size_bytes)}</small></span>
        <div className="backup-manager__actions">
          <button type="button" className="button button--secondary button--small" aria-label={`Restaurar ${backup.file_name}`} onClick={() => handlePrepareRestore(backup)} disabled={busy}><RotateCcw size={14} />Restaurar</button>
          <button type="button" className="button button--secondary button--small" aria-label={`Baixar ${backup.file_name}`} onClick={() => handleDownload(backup.id)}><Download size={14} />Baixar</button>
        </div>
      </li>)}</ul> : <p className="backup-manager__hint">Nenhum backup criado ainda.</p>}
      <h3>Histórico de sincronização</h3>
      {data.history.length ? <ul className="backup-manager__history">{data.history.map((entry) => <li key={entry.id}>
        <span>{entry.sync_type === 'backup' ? 'Backup' : entry.sync_type === 'google_calendar' ? 'Google Calendar' : entry.sync_type}</span>
        <strong data-status={entry.status}>{entry.status === 'success' ? 'Concluída' : entry.status === 'running' ? 'Em andamento' : entry.status === 'partial' ? 'Parcial' : 'Falhou'}</strong>
        <time>{new Date(entry.started_at).toLocaleString('pt-BR')}</time>
        {entry.details?.message && <small>{entry.details.message}</small>}
      </li>)}</ul> : <p className="backup-manager__hint">Nenhuma sincronização registrada.</p>}
      <div className="backup-manager__audit-heading">
        <h3>Alterações recentes</h3>
        <label>Tipo <select value={changeFilter} onChange={(event) => setChangeFilter(event.target.value)}><option value="all">Todos</option><option value="notes">Anotações</option><option value="tasks">Tarefas</option><option value="events">Eventos</option><option value="stored_files">Arquivos</option></select></label>
      </div>
      {data.changes.filter((entry) => changeFilter === 'all' || entry.entity_type === changeFilter).length ? <ul className="backup-manager__history">{data.changes.filter((entry) => changeFilter === 'all' || entry.entity_type === changeFilter).map((entry) => <li key={entry.id}>
        <span><strong>{ENTITY_LABELS[entry.entity_type] || entry.entity_type}</strong><small>{summarizeChange(entry)}</small></span>
        <strong>{entry.operation === 'INSERT' ? 'Criado' : entry.operation === 'UPDATE' ? 'Atualizado' : 'Excluído'}</strong>
        <time>{new Date(entry.occurred_at).toLocaleString('pt-BR')}</time>
      </li>)}</ul> : <p className="backup-manager__hint">Nenhuma alteração registrada para esse filtro.</p>}
    </>}
    {restoreTarget && <ConfirmDialog
      title="Restaurar backup"
      message={`Serão adicionados ${restoreTarget.preview.validCount} registros (${restoreTarget.preview.counts.notes} notas, ${restoreTarget.preview.counts.tasks} tarefas e ${restoreTarget.preview.counts.events} eventos). Os registros atuais não serão removidos nem substituídos; restaurar mais de uma vez pode criar duplicatas. Metadados de arquivos não são restaurados.`}
      confirmLabel="Adicionar dados do backup"
      busy={restoreBusy}
      onConfirm={handleRestore}
      onCancel={() => setRestoreTarget(null)}
    />}
  </div>
}
