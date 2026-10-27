import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Download, Upload } from 'lucide-react'
import CalendarGrid from '../../components/calendar/CalendarGrid.jsx'
import DayPanel from '../../components/calendar/DayPanel.jsx'
import EventModal from '../../components/calendar/EventModal.jsx'
import IcsImportModal from '../../components/calendar/IcsImportModal.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import ShareModal from '../../components/sharing/ShareModal.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useDataVersion } from '../../hooks/useDataVersion.js'
import { useLoad } from '../../hooks/useLoad.js'
import { useProfile } from '../../hooks/useProfile.js'
import { loadCalendarData } from '../../services/calendar/calendarService.js'
import { listCategories } from '../../services/categories/categoriesService.js'
import { deleteEvent } from '../../services/events/eventsService.js'
import { exportEventsAsIcs, importEventsFromIcs, parseIcsCalendar } from '../../services/calendar/icalService.js'
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
  const { user } = useAuth()
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
  const [shareTarget, setShareTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [icsPreview, setIcsPreview] = useState(null)
  const [icsBusy, setIcsBusy] = useState(false)
  const [icsError, setIcsError] = useState('')
  const [icsNotice, setIcsNotice] = useState('')
  const icsFileRef = useRef(null)

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

  async function handleIcsFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setIcsError('')
    setIcsNotice('')
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('O arquivo iCalendar excede 2 MB.')
      setIcsPreview(parseIcsCalendar(await file.text()))
    } catch (error) {
      setIcsError(friendlyError(error, 'Não foi possível ler esse arquivo iCalendar.'))
    }
  }

  async function handleIcsImport() {
    if (!icsPreview) return
    setIcsBusy(true)
    setIcsError('')
    try {
      const result = await importEventsFromIcs(icsPreview, user.id)
      const duplicates = result.skipped ? ` ${result.skipped} duplicado(s) ignorado(s).` : ''
      setIcsNotice(`${result.imported} evento(s) importado(s).${duplicates}`)
      setIcsPreview(null)
      calendar.reload()
    } catch (error) {
      setIcsError(friendlyError(error, 'Não foi possível importar os eventos.'))
    } finally {
      setIcsBusy(false)
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
          <div className="calendar-page__ics-actions">
            <button type="button" className="button button--secondary button--small" onClick={() => exportEventsAsIcs().catch((error) => setIcsError(friendlyError(error, 'Não foi possível exportar o calendário.')))}>
              <Download size={15} /> <span>Exportar .ics</span>
            </button>
            <button type="button" className="button button--secondary button--small" onClick={() => icsFileRef.current?.click()}>
              <Upload size={15} /> <span>Importar .ics</span>
            </button>
            <input ref={icsFileRef} className="calendar-page__file-input" type="file" accept=".ics,text/calendar" onChange={handleIcsFileChange} aria-label="Selecionar arquivo iCalendar" />
          </div>
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
        {icsError && !icsPreview && <Alert variant="error">{icsError}</Alert>}
        {icsNotice && <Alert variant="success">{icsNotice}</Alert>}
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
        onShareEvent={(event) => setShareTarget(event)}
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

      {icsPreview && (
        <IcsImportModal
          events={icsPreview}
          busy={icsBusy}
          error={icsError}
          onCancel={() => { setIcsPreview(null); setIcsError('') }}
          onConfirm={handleIcsImport}
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

      {shareTarget && (
        <ShareModal
          resourceId={shareTarget.id}
          resourceType="event"
          ownerId={user.id}
          onClose={() => setShareTarget(null)}
        />
      )}
    </div>
  )
}
