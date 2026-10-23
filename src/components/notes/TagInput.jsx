import { useId, useState } from 'react'
import { X } from 'lucide-react'
import './TagInput.css'

export default function TagInput({ tags, suggestions, onChange, disabled }) {
  const [text, setText] = useState('')
  const listId = useId()

  function addTag(raw) {
    const name = raw.trim().replace(/,+$/, '').slice(0, 40)
    setText('')
    if (!name) return
    if (tags.some((tag) => tag.toLowerCase() === name.toLowerCase())) return
    onChange([...tags, name])
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag(text)
    } else if (event.key === 'Backspace' && !text && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="tag-input">
      <span className="tag-input__label">Tags</span>
      <div className="tag-input__box">
        {tags.map((tag) => (
          <span key={tag} className="tag-input__chip">
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((item) => item !== tag))}
              disabled={disabled}
              aria-label={`Remover tag ${tag}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          value={text}
          list={listId}
          disabled={disabled}
          placeholder={tags.length === 0 ? 'Adicionar tag' : ''}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(text)}
          aria-label="Adicionar tag"
        />
        <datalist id={listId}>
          {suggestions
            .filter((name) => !tags.includes(name))
            .map((name) => (
              <option key={name} value={name} />
            ))}
        </datalist>
      </div>
    </div>
  )
}
