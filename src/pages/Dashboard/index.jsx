import { Link } from 'react-router-dom'
import { CalendarDays, CheckSquare, Code2, StickyNote } from 'lucide-react'
import QuickCreateMenu from '../../components/layout/QuickCreateMenu.jsx'
import FileLinkRow from '../../components/programming-library/FileLinkRow.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { useDataVersion } from '../../hooks/useDataVersion.js'
import { useLoad } from '../../hooks/useLoad.js'
import { useNow } from '../../hooks/useNow.js'
import { useProfile } from '../../hooks/useProfile.js'
import { loadDashboard } from '../../services/dashboard/dashboardService.js'
import {
  formatDateTime,
  formatLongDate,
  formatShortDate,
  formatTime,
  fromDateKey,
  isAllDayEvent,
  toDateKey
} from '../../utils/dates.js'
import { buildSnippet, getGreeting } from '../../utils/text.js'
import { getDueState } from '../../utils/tasks.js'
import './Dashboard.css'

function Section({ title, to, children }) {
  return (
    <section className="dashboard__section card">
      <header>
        <h3>{title}</h3>
        {to && (
          <Link to={to} className="dashboard__see-all">
            Ver tudo
          </Link>
        )}
      </header>
      {children}
    </section>
  )
}

function EventRow({ event, showDate }) {
  const start = new Date(event.start_at)
  const time = isAllDayEvent(event) ? 'Dia inteiro' : formatTime(start)
  return (
    <Link to={`/calendario?data=${toDateKey(start)}&evento=${event.id}`} className="dashboard__row">
      <span className="dashboard__bar" style={{ background: event.categories?.color || 'var(--color-accent)' }} />
      <span className="dashboard__row-main">
        <strong>{event.title}</strong>
        <span>{showDate ? `${formatShortDate(start)} · ${time}` : time}</span>
      </span>
      {event.categories && <Badge color={event.categories.color}>{event.categories.name}</Badge>}
    </Link>
  )
}

export default function Dashboard() {
  const { version } = useDataVersion()
  const { fullName } = useProfile()
  const now = useNow()
  const { data, loading, error, reload } = useLoad(loadDashboard, version)

  if (loading && !data) return <Spinner label="Carregando painel" />

  if (!data) {
    return (
      <div className="stack">
        <Alert variant="error">{error || 'Não foi possível carregar o painel.'}</Alert>
        <div>
          <button type="button" className="button button--secondary" onClick={reload}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const firstName = fullName.trim().split(/\s+/)[0]

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <h2>
            {getGreeting(now)}
            {firstName ? `, ${firstName}` : ''}
          </h2>
          <p>{formatLongDate(now)}</p>
        </div>
        <QuickCreateMenu label="Criar" />
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="dashboard__stats">
        <Link to="/tarefas" className="dashboard__stat card">
          <span className="dashboard__stat-icon">
            <CheckSquare size={20} />
          </span>
          <strong>{data.pending}</strong>
          <span>Tarefas pendentes</span>
        </Link>
        <Link to="/tarefas" className="dashboard__stat card dashboard__stat--danger">
          <span className="dashboard__stat-icon">
            <CheckSquare size={20} />
          </span>
          <strong>{data.overdue}</strong>
          <span>Tarefas atrasadas</span>
        </Link>
        <Link to="/calendario" className="dashboard__stat card">
          <span className="dashboard__stat-icon">
            <CalendarDays size={20} />
          </span>
          <strong>{data.todayEvents.length}</strong>
          <span>Compromissos hoje</span>
        </Link>
        <Link to="/anotacoes" className="dashboard__stat card">
          <span className="dashboard__stat-icon">
            <StickyNote size={20} />
          </span>
          <strong>{data.notesTotal}</strong>
          <span>Anotações</span>
        </Link>
      </div>

      <div className="dashboard__grid">
        <Section title="Compromissos de hoje" to="/calendario">
          {data.todayEvents.length === 0 && <p className="dashboard__empty">Nenhum compromisso para hoje.</p>}
          {data.todayEvents.map((event) => (
            <EventRow key={event.id} event={event} showDate={false} />
          ))}
        </Section>

        <Section title="Próximos trabalhos e eventos" to="/calendario">
          {data.upcomingEvents.length === 0 && <p className="dashboard__empty">Nenhum evento nos próximos 30 dias.</p>}
          {data.upcomingEvents.map((event) => (
            <EventRow key={event.id} event={event} showDate />
          ))}
        </Section>

        <Section title="Prazos próximos" to="/tarefas">
          {data.upcomingTasks.length === 0 && <p className="dashboard__empty">Nenhuma tarefa com prazo em aberto.</p>}
          {data.upcomingTasks.map((task) => {
            const dueState = getDueState(task, now)
            return (
              <Link key={task.id} to={`/tarefas?tarefa=${task.id}`} className="dashboard__row">
                <span className="dashboard__row-main">
                  <strong>{task.title}</strong>
                  <span className={`dashboard__due dashboard__due--${dueState}`}>
                    {formatDateTime(new Date(task.due_at))}
                    {dueState === 'overdue' ? ' · atrasada' : ''}
                  </span>
                </span>
                {task.categories && <Badge color={task.categories.color}>{task.categories.name}</Badge>}
              </Link>
            )
          })}
        </Section>

        <Section title="Anotações recentes" to="/anotacoes">
          {data.recentNotes.length === 0 && <p className="dashboard__empty">Nenhuma anotação criada ainda.</p>}
          {data.recentNotes.map((note) => (
            <Link key={note.id} to={`/anotacoes?nota=${note.id}`} className="dashboard__row">
              <span className="dashboard__row-main">
                <strong>{note.title || 'Sem título'}</strong>
                <span>
                  {note.linked_date ? `Data: ${formatShortDate(fromDateKey(note.linked_date))}` : buildSnippet(note.content, 60) || 'Anotação vazia'}
                </span>
              </span>
            </Link>
          ))}
        </Section>

        <Section title="Arquivos enviados recentemente" to="/arquivos-recentes">
          {data.recentFiles.length === 0 && <p className="dashboard__empty">Nenhum arquivo enviado ainda.</p>}
          {data.recentFiles.map((file) => (
            <FileLinkRow key={file.id} file={file} dateField="created_at" />
          ))}
        </Section>

        <Section title="Atalhos">
          <div className="dashboard__shortcuts">
            <Link to="/calendario" className="dashboard__shortcut">
              <CalendarDays size={18} />
              Calendário
            </Link>
            <Link to="/tarefas" className="dashboard__shortcut">
              <CheckSquare size={18} />
              Tarefas
            </Link>
            <Link to="/anotacoes" className="dashboard__shortcut">
              <StickyNote size={18} />
              Anotações
            </Link>
            <Link to="/biblioteca" className="dashboard__shortcut">
              <Code2 size={18} />
              Biblioteca
            </Link>
          </div>
        </Section>
      </div>
    </div>
  )
}
