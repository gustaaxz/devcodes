import { useState } from 'react'
import { CheckSquare, StickyNote } from 'lucide-react'
import { getWeekdays, isSameDay, toDateKey } from '../../utils/dates.js'
import './CalendarGrid.css'

const MAX_VISIBLE_EVENTS = 2

export default function CalendarGrid({ grid, month, weekStart, selectedKey, eventsByDay, tasksByDay, notesByDay, onSelect }) {
  const [today] = useState(() => new Date())

  return (
    <div className="calendar-grid">
      {getWeekdays(weekStart).map((weekday) => (
        <div key={weekday} className="calendar-grid__weekday">
          {weekday}
        </div>
      ))}
      {grid.map((date) => {
        const key = toDateKey(date)
        const events = eventsByDay[key] || []
        const taskCount = (tasksByDay[key] || []).length
        const noteCount = (notesByDay[key] || []).length
        const classes = [
          'calendar-day',
          date.getMonth() !== month.getMonth() ? 'calendar-day--outside' : '',
          isSameDay(date, today) ? 'calendar-day--today' : '',
          key === selectedKey ? 'calendar-day--selected' : ''
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <button key={key} type="button" className={classes} onClick={() => onSelect(key)}>
            <span className="calendar-day__number">{date.getDate()}</span>
            <span className="calendar-day__events">
              {events.slice(0, MAX_VISIBLE_EVENTS).map((event) => (
                <span
                  key={event.id}
                  className="calendar-day__chip"
                  style={{ '--chip-color': event.categories?.color || 'var(--color-accent)' }}
                >
                  {event.title}
                </span>
              ))}
              {events.length > MAX_VISIBLE_EVENTS && (
                <span className="calendar-day__more">+{events.length - MAX_VISIBLE_EVENTS}</span>
              )}
            </span>
            {(taskCount > 0 || noteCount > 0) && (
              <span className="calendar-day__indicators">
                {taskCount > 0 && (
                  <span title={`${taskCount} tarefa(s)`}>
                    <CheckSquare size={12} />
                    {taskCount}
                  </span>
                )}
                {noteCount > 0 && (
                  <span title={`${noteCount} anotação(ões)`}>
                    <StickyNote size={12} />
                    {noteCount}
                  </span>
                )}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
