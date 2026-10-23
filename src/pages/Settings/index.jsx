import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, KeyRound, LogOut, Settings2 } from 'lucide-react'
import CategoryManagerModal from '../../components/programming-library/CategoryManagerModal.jsx'
import Alert from '../../components/ui/Alert.jsx'
import SelectField from '../../components/ui/SelectField.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import TextField from '../../components/ui/TextField.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useLoad } from '../../hooks/useLoad.js'
import { useProfile } from '../../hooks/useProfile.js'
import { listFiles } from '../../services/files/filesService.js'
import { listProgrammingCategories } from '../../services/programming-categories/programmingCategoriesService.js'
import { exportNotesAsCSV, exportNotesAsJSON_Download, exportTasksAsCSV, exportTasksAsJSON_Download, exportEventsAsCSV, exportEventsAsJSON_Download } from '../../services/export/exportService.js'
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
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? 'segmented__item segmented__item--active' : 'segmented__item'}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function Section({ title, description, children }) {
  return (
    <section className="settings__section card">
      <header>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </header>
      {children}
    </section>
  )
}

function Row({ label, hint, children }) {
  return (
    <div className="settings__row">
      <div className="settings__row-text">
        <strong>{label}</strong>
        {hint && <span>{hint}</span>}
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

  async function savePreference(patch) {
    setNotice(null)
    try {
      await updatePreferences(patch)
      setNotice({ variant: 'success', text: 'Preferência salva.' })
    } catch (error) {
      setNotice({ variant: 'error', text: friendlyError(error, 'Não foi possível salvar a preferência.') })
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

      <Section title="Exportar dados" description="Faça backup dos seus dados em CSV ou JSON.">
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

      <Section title="Conta">
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
