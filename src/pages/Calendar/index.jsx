import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CalendarGrid from '../../components/calendar/CalendarGrid.jsx'
import DayPanel from '../../components/calendar/DayPanel.jsx'
import EventModal from '../../components/calendar/EventModal.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { useDataVersion } from '../../hooks/useDataVersion.js'
import { useLoad } from '../../hooks/useLoad.js'
import { useProfile } from '../../hooks/useProfile.js'
import { loadCalendarData } from '../../services/calendar/calendarService.js'
import { listCategories } from '../../services/categories/categoriesService.js'
import { deleteEvent } from '../../services/events/eventsService.js'
import { addMonths, buildMonthGrid, formatMonthYear, fromDateKey, toDateKey } from '../../utils/dates.js'
import { friendlyError } from '../../utils/errors.js'
import './Calendar.css'

function groupBy(items, getKey) {
  const groups = {}
  for (const item of items) {
    const key = getKey(item)
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

export default function Calendar() {
  const [params, setParams] = useSearchParams()
  const { preferences } = useProfile()
  const { version } = useDataVersion()
  const weekStart = preferences.calendar.weekStart
  const [initialKey] = useState(() => {
    const value = params.get('data')
    return /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value : toDateKey(new Date())
  })
  const [month, setMonth] = useState(() => {
    const base = fromDateKey(initialKey)
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const [selectedKey, setSelectedKey] = useState(initialKey)
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const grid = useMemo(() => buildMonthGrid(month, weekStart), [month, weekStart])
  const rangeStart = grid[0]
  const rangeEnd = new Date(grid[41].getFullYear(), grid[41].getMonth(), grid[41].getDate() + 1)

  const calendar = useLoad(() => loadCalendarData(rangeStart, rangeEnd), `${month.getTime()}-${weekStart}-${version}`)
  const categories = useLoad(listCategories)

  const eventsByDay = useMemo(
    () => groupBy(calendar.data?.events || [], (event) => toDateKey(new Date(event.start_at))),
    [calendar.data]
  )
  const tasksByDay = useMemo(
    () => groupBy(calendar.data?.tasks || [], (task) => toDateKey(new Date(task.due_at))),
    [calendar.data]
  )
  const notesByDay = useMemo(() => groupBy(calendar.data?.notes || [], (note) => note.linked_date), [calendar.data])

  const requestedEventId = params.get('evento')
  const requestedEvent = (calendar.data?.events || []).find((event) => event.id === requestedEventId) || null
  const activeModal = modal ?? (requestedEvent ? { event: requestedEvent } : null)

  function closeModal() {
    setModal(null)
    if (requestedEventId) setParams({}, { replace: true })
  }

  function goToToday() {
    const now = new Date()
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedKey(toDateKey(now))
  }

  function handleSelect(key) {
    setSelectedKey(key)
    const [year, monthNumber] = key.split('-').map(Number)
    if (year !== month.getFullYear() || monthNumber - 1 !== month.getMonth()) {
      setMonth(new Date(year, monthNumber - 1, 1))
    }
  }

  function handleSaved() {
    closeModal()
    calendar.reload()
  }

  async function handleConfirmDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteEvent(deleteTarget.id)
      setDeleteTarget(null)
      calendar.reload()
    } catch (error) {
      setDeleteError(friendlyError(error, 'Não foi possível excluir o evento.'))
    } finally {
      setDeleting(false)
    }
  }

  if (calendar.loading && !calendar.data) {
    return <Spinner label="Carregando calendário" />
  }

  return (
    <div className="calendar-page">
      <div className="calendar-page__main">
        <div className="page-toolbar">
          <h2 className="calendar-page__month">{formatMonthYear(month)}</h2>
          <div className="page-toolbar__spacer" />
          <button type="button" className="button button--secondary" onClick={goToToday}>
            Hoje
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => setMonth((current) => addMonths(current, -1))}
            aria-label="Mês anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => setMonth((current) => addMonths(current, 1))}
            aria-label="Próximo mês"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        {calendar.error && <Alert variant="error">{calendar.error}</Alert>}
        {categories.error && <Alert variant="error">{categories.error}</Alert>}
        <CalendarGrid
          grid={grid}
          month={month}
          weekStart={weekStart}
          selectedKey={selectedKey}
          eventsByDay={eventsByDay}
          tasksByDay={tasksByDay}
          notesByDay={notesByDay}
          onSelect={handleSelect}
        />
      </div>

      <DayPanel
        dateKey={selectedKey}
        events={eventsByDay[selectedKey] || []}
        tasks={tasksByDay[selectedKey] || []}
        notes={notesByDay[selectedKey] || []}
        onCreateEvent={() => setModal({ event: null })}
        onEditEvent={(event) => setModal({ event })}
        onDeleteEvent={(event) => {
          setDeleteError('')
          setDeleteTarget(event)
        }}
      />

      {activeModal && (
        <EventModal
          event={activeModal.event}
          defaultDateKey={selectedKey}
          categories={categories.data || []}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Excluir evento"
          message={`Deseja excluir o evento "${deleteTarget.title}"? Esta ação não pode ser desfeita.`}
          busy={deleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
