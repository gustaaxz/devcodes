import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckSquare, Columns3, List, Plus } from 'lucide-react'
import TaskCard from '../../components/tasks/TaskCard.jsx'
import TaskModal from '../../components/tasks/TaskModal.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import SelectField from '../../components/ui/SelectField.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useDataVersion } from '../../hooks/useDataVersion.js'
import { useLoad } from '../../hooks/useLoad.js'
import { useNow } from '../../hooks/useNow.js'
import { useRealtimeSync } from '../../hooks/useRealtimeSync.js'
import { listCategories } from '../../services/categories/categoriesService.js'
import { deleteTask, listTasks, setTaskStatus } from '../../services/tasks/tasksService.js'
import { isSameDay } from '../../utils/dates.js'
import { friendlyError } from '../../utils/errors.js'
import { PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../../utils/labels.js'
import { compareTasks, getDueState } from '../../utils/tasks.js'
import './Tasks.css'

const DUE_FILTER_OPTIONS = [
  { value: 'overdue', label: 'Atrasadas' },
  { value: 'today', label: 'Vencem hoje' },
  { value: 'week', label: 'Próximos 7 dias' },
  { value: 'none', label: 'Sem prazo' }
]

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function matchesDue(task, filter, now) {
  if (!filter) return true
  if (filter === 'none') return !task.due_at
  if (!task.due_at) return false
  const due = new Date(task.due_at)
  if (filter === 'overdue') return getDueState(task, now) === 'overdue'
  if (filter === 'today') return isSameDay(due, now)
  return due >= now && due.getTime() - now.getTime() <= WEEK_MS
}

export default function Tasks() {
  const { user } = useAuth()
  const now = useNow()
  const { version } = useDataVersion()
  const [params, setParams] = useSearchParams()
  const tasks = useLoad(listTasks, version)
  const categories = useLoad(listCategories)
  const [view, setView] = useState('list')
  const [filters, setFilters] = useState(() => ({ status: '', category: params.get('categoria') || '', priority: '', due: '', tag: params.get('tag') || '' }))
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  // Setup realtime sync for tasks
  useRealtimeSync(
    'tasks',
    { filter: `user_id=eq.${user.id}` },
    (updated) => {
      tasks.data = (tasks.data || []).map((task) =>
        task.id === updated.id ? { ...task, ...updated } : task
      )
    },
    (deleted) => {
      tasks.data = (tasks.data || []).filter((task) => task.id !== deleted.id)
    },
    (inserted) => {
      if (!tasks.data?.some((t) => t.id === inserted.id)) {
        tasks.data = [{ ...inserted, tags: [] }, ...(tasks.data || [])]
      }
    }
  )

  const requestedTaskId = params.get('tarefa')
  const requestedTask = (tasks.data || []).find((task) => task.id === requestedTaskId) || null
  const activeModal = modal ?? (requestedTask ? { task: requestedTask } : null)

  function closeModal() {
    setModal(null)
    if (requestedTaskId) setParams({}, { replace: true })
  }

  function setFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const filtered = useMemo(() => {
    return (tasks.data || [])
      .filter((task) => !filters.status || task.status === filters.status)
      .filter((task) => !filters.category || task.category_id === filters.category)
      .filter((task) => !filters.priority || task.priority === filters.priority)
      .filter((task) => matchesDue(task, filters.due, now))
      .filter((task) => !filters.tag || task.tags?.some((tag) => tag.name === filters.tag))
      .sort(compareTasks)
  }, [tasks.data, filters, now])

  const overdueCount = useMemo(
    () => (tasks.data || []).filter((task) => getDueState(task, now) === 'overdue').length,
    [tasks.data, now]
  )

  async function changeStatus(task, status) {
    setActionError('')
    const previousTasks = tasks.data
    // Atualização otimista
    tasks.data = (tasks.data || []).map((t) => (t.id === task.id ? { ...t, status } : t))
    try {
      await setTaskStatus(task.id, status)
      tasks.reload()
    } catch (error) {
      // Revert ao status anterior se falhar
      tasks.data = previousTasks
      setActionError(friendlyError(error, 'Não foi possível atualizar a tarefa.'))
    }
  }

  function toggleDone(task) {
    return changeStatus(task, task.status === 'done' ? 'pending' : 'done')
  }

  async function confirmDelete() {
    setBusy(true)
    setActionError('')
    try {
      await deleteTask(deleteTarget.id)
      setDeleteTarget(null)
      tasks.reload()
    } catch (error) {
      setActionError(friendlyError(error, 'Não foi possível excluir a tarefa.'))
    } finally {
      setBusy(false)
    }
  }

  function handleSaved() {
    closeModal()
    tasks.reload()
  }

  if (tasks.loading && !tasks.data) return <Spinner label="Carregando tarefas" />

  const hasTasks = (tasks.data || []).length > 0
  const cardHandlers = {
    now,
    onToggleDone: toggleDone,
    onEdit: (task) => setModal({ task }),
    onDelete: (task) => setDeleteTarget(task),
    onStatusChange: changeStatus
  }

  return (
    <div className="tasks-page">
      <div className="page-toolbar">
        <div className="tasks-page__summary">
          <strong>{(tasks.data || []).length} tarefas</strong>
          {overdueCount > 0 && <span className="tasks-page__overdue">{overdueCount} atrasada(s)</span>}
        </div>
        <div className="page-toolbar__spacer" />
        <div className="segmented" role="group" aria-label="Modo de visualização">
          <button
            type="button"
            className={view === 'list' ? 'segmented__item segmented__item--active' : 'segmented__item'}
            onClick={() => setView('list')}
          >
            <List size={16} />
            Lista
          </button>
          <button
            type="button"
            className={view === 'board' ? 'segmented__item segmented__item--active' : 'segmented__item'}
            onClick={() => setView('board')}
          >
            <Columns3 size={16} />
            Quadro
          </button>
        </div>
        <button type="button" className="button button--primary" onClick={() => setModal({ task: null })}>
          <Plus size={16} />
          Nova tarefa
        </button>
      </div>

      <div className="tasks-page__filters">
        <SelectField
          aria-label="Filtrar por status"
          placeholder="Todos os status"
          options={TASK_STATUS_OPTIONS}
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
        />
        <SelectField
          aria-label="Filtrar por categoria"
          placeholder="Todas as categorias"
          options={(categories.data || []).map((category) => ({ value: category.id, label: category.name }))}
          value={filters.category}
          onChange={(e) => setFilter('category', e.target.value)}
        />
        <SelectField
          aria-label="Filtrar por prioridade"
          placeholder="Todas as prioridades"
          options={PRIORITY_OPTIONS}
          value={filters.priority}
          onChange={(e) => setFilter('priority', e.target.value)}
        />
        <SelectField
          aria-label="Filtrar por prazo"
          placeholder="Qualquer prazo"
          options={DUE_FILTER_OPTIONS}
          value={filters.due}
          onChange={(e) => setFilter('due', e.target.value)}
        />
        <SelectField
          aria-label="Filtrar por tag"
          placeholder="Todas as tags"
          options={[...new Set((tasks.data || []).flatMap((task) => (task.tags || []).map((tag) => tag.name)))].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((name) => ({ value: name, label: name }))}
          value={filters.tag}
          onChange={(e) => setFilter('tag', e.target.value)}
        />
      </div>

      {tasks.error && <Alert variant="error">{tasks.error}</Alert>}
      {categories.error && <Alert variant="error">{categories.error}</Alert>}
      {actionError && <Alert variant="error">{actionError}</Alert>}

      {!hasTasks && !tasks.error && (
        <EmptyState
          icon={CheckSquare}
          title="Nenhuma tarefa cadastrada"
          description="Crie sua primeira tarefa para acompanhar prazos e prioridades."
        />
      )}

      {hasTasks && filtered.length === 0 && (
        <EmptyState
          icon={CheckSquare}
          title="Nenhuma tarefa encontrada"
          description="Nenhuma tarefa corresponde aos filtros selecionados."
        />
      )}

      {filtered.length > 0 && view === 'list' && (
        <div className="tasks-page__list">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} {...cardHandlers} />
          ))}
        </div>
      )}

      {filtered.length > 0 && view === 'board' && (
        <div className="tasks-page__board">
          {TASK_STATUS_OPTIONS.map((column) => {
            const columnTasks = filtered.filter((task) => task.status === column.value)
            return (
              <section key={column.value} className="tasks-page__column">
                <h3>
                  {column.label}
                  <span>{columnTasks.length}</span>
                </h3>
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} showStatusSelect {...cardHandlers} />
                ))}
              </section>
            )
          })}
        </div>
      )}

      {activeModal && (
        <TaskModal
          task={activeModal.task}
          categories={categories.data || []}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Excluir tarefa"
          message={`Deseja excluir a tarefa "${deleteTarget.title}"? Esta ação não pode ser desfeita.`}
          busy={busy}
          error={actionError}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
