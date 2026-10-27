import { listEventsInRange } from '../events/eventsService.js'
import { listTasksDueInRange } from '../tasks/tasksService.js'
import { listNotesLinkedBetween } from '../notes/notesService.js'
import { listGoogleMappedEventIds } from './googleCalendarService.js'
import { toDateKey } from '../../utils/dates.js'

export async function loadCalendarData(start, endExclusive) {
  const lastDay = new Date(endExclusive.getFullYear(), endExclusive.getMonth(), endExclusive.getDate() - 1)
  const [events, tasks, notes] = await Promise.all([
    listEventsInRange(start, endExclusive),
    listTasksDueInRange(start, endExclusive),
    listNotesLinkedBetween(toDateKey(start), toDateKey(lastDay))
  ])
  const mappedEventIds = await listGoogleMappedEventIds(events.map((event) => event.id))
  return {
    events: events.map((event) => ({ ...event, google_synced: mappedEventIds.has(event.id) })),
    tasks,
    notes
  }
}
