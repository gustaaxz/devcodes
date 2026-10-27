import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, KeyRound, LogOut, Settings2 } from 'lucide-react'
import CategoryManagerModal from '../../components/programming-library/CategoryManagerModal.jsx'
import DataImportPanel from '../../components/settings/DataImportPanel.jsx'
import BackupManager from '../../components/settings/BackupManager.jsx'
import AuditLogPanel from '../../components/settings/AuditLogPanel.jsx'
import GoogleCalendarIntegration from '../../components/settings/GoogleCalendarIntegration.jsx'
import MfaSettings from '../../components/settings/MfaSettings.jsx'
import Alert from '../../components/ui/Alert.jsx'
import SelectField from '../../components/ui/SelectField.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import TextField from '../../components/ui/TextField.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useLoad } from '../../hooks/useLoad.js'
import { useProfile } from '../../hooks/useProfile.js'
import { listFiles } from '../../services/files/filesService.js'
import { listProgrammingCategories } from '../../services/programming-categories/programmingCategoriesService.js'
import { getReminderPreferences, REMINDER_OFFSET_OPTIONS, saveReminderPreferences } from '../../services/reminders/reminderService.js'
import { exportNotesAsCSV, exportNotesAsJSON_Download, exportTasksAsCSV, exportTasksAsJSON_Download, exportEventsAsCSV, exportEventsAsJSON_Download, exportFullBackupDownload } from '../../services/export/exportService.js'
import { translate } from '../../utils/i18n.js'
import { useLocale } from '../../hooks/useLocale.js'
import { friendlyError } from '../../utils/errors.js'
import './Settings.css'

const SORT_OPTIONS = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'modified', label: 'Modificados recentemente' },
  { value: 'name', label: 'Nome (A-Z)' },
  { value: 'size', label: 'Maior tamanho' }
]

async function loadLibrarySnapshot() {
  const [categories, files] = await Promise.all([listProgrammingCategories(), listFiles()])
  return { categories, files }
}

function Segmented({ label, value, options, onChange }) {
  const locale = useLocale()
  return (
      <div className="segmented" role="group" aria-label={translate(locale, label)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? 'segmented__item segmented__item--active' : 'segmented__item'}
          onClick={() => onChange(option.value)}
        >
          {translate(locale, option.label)}
        </button>
      ))}
    </div>
  )
}

function Section({ title, description, children }) {
  const locale = useLocale()
  return (
    <section className="settings__section card">
      <header>
        <h2>{translate(locale, title)}</h2>
        {description && <p>{translate(locale, description)}</p>}
      </header>
      {children}
    </section>
  )
}

function Row({ label, hint, children }) {
  const locale = useLocale()
  return (
    <div className="settings__row">
      <div className="settings__row-text">
        <strong>{translate(locale, label)}</strong>
        {hint && <span>{translate(locale, hint)}</span>}
      </div>
      <div className="settings__row-control">{children}</div>
    </div>
  )
}

export default function Settings() {
  const { user, signOut } = useAuth()
  const { fullName, preferences, updatePreferences, updateFullName } = useProfile()
  const library = useLoad(loadLibrarySnapshot)
  const [nameDraft, setNameDraft] = useState(fullName)
  const [savingName, setSavingName] = useState(false)
  const [notice, setNotice] = useState(null)
  const [managing, setManaging] = useState(false)
  const [reminderPreferences, setReminderPreferences] = useState({
    in_app_enabled: true,
    email_enabled: false,
    default_offset_minutes: 15
  })
  const [savingReminderPreferences, setSavingReminderPreferences] = useState(false)

  useEffect(() => {
    let active = true
    getReminderPreferences(user.id)
      .then((preferences) => {
        if (active) setReminderPreferences(preferences)
      })
      .catch((error) => {
        if (active) setNotice({ variant: 'error', text: friendlyError(error, 'Não foi possível carregar os lembretes.') })
      })
    return () => { active = false }
  }, [user.id])

  async function savePreference(patch) {
    setNotice(null)
    try {
      await updatePreferences(patch)
      setNotice({ variant: 'success', text: 'Preferência salva.' })
    } catch (error) {
      setNotice({ variant: 'error', text: friendlyError(error, 'Não foi possível salvar a preferência.') })
    }
  }

  async function saveReminderPreference(patch) {
    setNotice(null)
    setSavingReminderPreferences(true)
    try {
      const saved = await saveReminderPreferences(user.id, { ...reminderPreferences, ...patch })
      setReminderPreferences(saved)
      setNotice({ variant: 'success', text: 'Preferência de lembretes salva.' })
    } catch (error) {
      setNotice({ variant: 'error', text: friendlyError(error, 'Não foi possível salvar a preferência de lembretes.') })
    } finally {
      setSavingReminderPreferences(false)
    }
  }

  async function handleNameSubmit(event) {
    event.preventDefault()
    setNotice(null)
    setSavingName(true)
    try {
      await updateFullName(nameDraft)
      setNotice({ variant: 'success', text: 'Nome atualizado.' })
    } catch (error) {
      setNotice({ variant: 'error', text: friendlyError(error, 'Não foi possível atualizar o nome.') })
    } finally {
      setSavingName(false)
    }
  }

  async function handleSignOut() {
    try {
      await signOut()
    } catch {
      setNotice({ variant: 'error', text: 'Não foi possível encerrar a sessão.' })
    }
  }

  return (
    <div className="settings">
      {notice && <Alert variant={notice.variant}>{notice.text}</Alert>}

      <Section title="Perfil" description="Como você aparece no painel e no menu do usuário.">
        <form className="settings__form" onSubmit={handleNameSubmit}>
          <TextField
            label="Nome de exibição"
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            maxLength={80}
          />
          <button type="submit" className="button button--primary" disabled={savingName}>
            {savingName ? <Spinner size={16} /> : 'Salvar nome'}
          </button>
        </form>
        <Row label={translate(preferences.locale, 'settings.language')} hint={translate(preferences.locale, 'settings.languageHint')}>
          <SelectField
            aria-label={translate(preferences.locale, 'settings.language')}
            options={[
              { value: 'pt-BR', label: translate(preferences.locale, 'language.pt') },
              { value: 'en-US', label: translate(preferences.locale, 'language.en') }
            ]}
            value={preferences.locale}
            onChange={(event) => savePreference({ locale: event.target.value })}
          />
        </Row>
      </Section>

      <Section title="Aparência">
        <Row label="Tema" hint="O tema escuro é o padrão.">
          <Segmented
            label="Tema"
            value={preferences.theme}
            options={[
              { value: 'dark', label: 'Escuro' },
              { value: 'light', label: 'Claro' }
            ]}
            onChange={(theme) => savePreference({ theme })}
          />
        </Row>
      </Section>

      <Section title="Calendário">
        <Row label="Primeiro dia da semana" hint="Define a primeira coluna da visualização mensal.">
          <Segmented
            label="Primeiro dia da semana"
            value={String(preferences.calendar.weekStart)}
            options={[
              { value: '0', label: 'Domingo' },
              { value: '1', label: 'Segunda-feira' }
            ]}
            onChange={(value) => savePreference({ calendar: { weekStart: Number(value) } })}
          />
        </Row>
      </Section>

      <GoogleCalendarIntegration userId={user.id} />

      <Section title="Lembretes de tarefas" description="Receba avisos dentro do DevCodes para tarefas com prazo. Os lembretes são verificados enquanto o aplicativo está aberto.">
        <Row label="Notificações no aplicativo" hint="Exibe um aviso na central quando o lembrete vence.">
          <Segmented
            label="Notificações no aplicativo"
            value={String(reminderPreferences.in_app_enabled)}
            options={[
              { value: 'true', label: 'Ativadas' },
              { value: 'false', label: 'Desativadas' }
            ]}
            onChange={(value) => saveReminderPreference({ in_app_enabled: value === 'true' })}
          />
        </Row>
        <Row label="Antecedência padrão" hint="Usada ao ativar lembretes em novas tarefas.">
          <SelectField
            aria-label="Antecedência padrão dos lembretes"
            options={REMINDER_OFFSET_OPTIONS}
            value={String(reminderPreferences.default_offset_minutes)}
            disabled={savingReminderPreferences}
            onChange={(event) => saveReminderPreference({ default_offset_minutes: Number(event.target.value) })}
          />
        </Row>
      </Section>

      <Section title="Biblioteca de Programação">
        <Row label="Exibição padrão" hint="Aplicada ao abrir a biblioteca.">
          <Segmented
            label="Exibição padrão"
            value={preferences.library.layout}
            options={[
              { value: 'list', label: 'Lista' },
              { value: 'grid', label: 'Grade' }
            ]}
            onChange={(layout) => savePreference({ library: { layout } })}
          />
        </Row>
        <Row label="Ordenação padrão">
          <SelectField
            aria-label="Ordenação padrão"
            options={SORT_OPTIONS}
            value={preferences.library.sort}
            onChange={(event) => savePreference({ library: { sort: event.target.value } })}
          />
        </Row>
        <Row
          label="Categorias de programação"
          hint={library.data ? `${library.data.categories.length} categoria(s)` : 'Criar, renomear, reordenar e excluir.'}
        >
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setManaging(true)}
            disabled={!library.data}
          >
            <Settings2 size={16} />
            Gerenciar
          </button>
        </Row>
        {library.error && <Alert variant="error">{library.error}</Alert>}
      </Section>

      <Section title="Organização por tags" description="Crie tags com cores, veja onde são usadas, favorite-as e mescle duplicatas.">
        <Row label="Tags universais" hint="As tags organizam anotações, tarefas e arquivos da biblioteca.">
          <Link to="/tags" className="button button--secondary">
            Gerenciar tags
          </Link>
        </Row>
      </Section>

      <Section title="Auditoria da conta" description="Consulte alterações recentes sem expor o conteúdo dos registros.">
        <AuditLogPanel />
      </Section>

      <Section title="Exportar dados" description="Faça backup dos seus dados em CSV ou JSON.">
        <Row label="Backup completo" hint="Um arquivo JSON portátil com anotações, tarefas, eventos, categorias e tags de anotações.">
          <button
            type="button"
            className="button button--primary button--small"
            onClick={() => exportFullBackupDownload().catch((error) => setNotice({ variant: 'error', text: friendlyError(error, 'Não foi possível exportar o backup.') }))}
          >
            <Download size={14} />
            Exportar backup JSON
          </button>
        </Row>
        <Row label="Anotações">
          <div className="settings__export-buttons">
            <button
              type="button"
              className="button button--secondary button--small"
              onClick={() => exportNotesAsCSV()}
            >
              <Download size={14} />
              CSV
            </button>
            <button
              type="button"
              className="button button--secondary button--small"
              onClick={() => exportNotesAsJSON_Download()}
            >
              <Download size={14} />
              JSON
            </button>
          </div>
        </Row>
        <Row label="Tarefas">
          <div className="settings__export-buttons">
            <button
              type="button"
              className="button button--secondary button--small"
              onClick={() => exportTasksAsCSV()}
            >
              <Download size={14} />
              CSV
            </button>
            <button
              type="button"
              className="button button--secondary button--small"
              onClick={() => exportTasksAsJSON_Download()}
            >
              <Download size={14} />
              JSON
            </button>
          </div>
        </Row>
        <Row label="Eventos">
          <div className="settings__export-buttons">
            <button
              type="button"
              className="button button--secondary button--small"
              onClick={() => exportEventsAsCSV()}
            >
              <Download size={14} />
              CSV
            </button>
            <button
              type="button"
              className="button button--secondary button--small"
              onClick={() => exportEventsAsJSON_Download()}
            >
              <Download size={14} />
              JSON
            </button>
          </div>
        </Row>
      </Section>

      <Section title="Importar dados" description="Adicione dados de um backup DevCodes ou de arquivos CSV/JSON exportados pelo app.">
        <DataImportPanel />
      </Section>

      <Section title="Backup automático e histórico" description="Crie backups comprimidos, configure a retenção e consulte execuções recentes.">
        <BackupManager />
      </Section>

      <Section title="Conta">
        <Row label="Autenticação em duas etapas" hint="Use um app autenticador para proteger o acesso à conta.">
          <MfaSettings />
        </Row>
        <Row label="E-mail">
          <span className="settings__value">{user.email}</span>
        </Row>
        <Row label="Senha" hint="Defina uma nova senha para a sua conta.">
          <Link to="/redefinir-senha" className="button button--secondary">
            <KeyRound size={16} />
            Alterar senha
          </Link>
        </Row>
        <Row label="Sessão">
          <button type="button" className="button button--danger" onClick={handleSignOut}>
            <LogOut size={16} />
            Sair
          </button>
        </Row>
      </Section>

      {managing && library.data && (
        <CategoryManagerModal
          categories={library.data.categories}
          files={library.data.files}
          onClose={() => setManaging(false)}
          onChanged={library.reload}
        />
      )}
    </div>
  )
}
