import { Pin, Share2, Star } from 'lucide-react'
import { formatShortDate, fromDateKey } from '../../utils/dates.js'
import './NoteList.css'

function buildSnippet(content) {
  return content
    .replace(/[#*_-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90)
}

export default function NoteList({ notes, selectedId, onSelect }) {
  return (
    <ul className="note-list">
      {notes.map((note) => (
        <li key={note.id}>
          <button
            type="button"
            className={`note-list__item${note.id === selectedId ? ' note-list__item--active' : ''}`}
            onClick={() => onSelect(note.id)}
          >
            <span className="note-list__top">
              <strong>{note.title || 'Sem título'}</strong>
              <span className="note-list__icons">
                {note.is_shared && <Share2 size={13} title="Compartilhado" />}
                {note.is_pinned && <Pin size={13} />}
                {note.is_favorite && <Star size={13} />}
              </span>
            </span>
            <span className="note-list__snippet">{buildSnippet(note.content) || 'Anotação vazia'}</span>
            <span className="note-list__meta">
              <span>
                {note.linked_date
                  ? formatShortDate(fromDateKey(note.linked_date))
                  : formatShortDate(new Date(note.updated_at))}
              </span>
              {note.tags.slice(0, 2).map((tag) => (
                <span key={tag.id} className="note-list__tag">
                  {tag.name}
                </span>
              ))}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
