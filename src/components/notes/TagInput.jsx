import { useId, useState } from 'react'
import { X } from 'lucide-react'
import { suggestTags } from '../../services/tags/tagService.js'
import './TagInput.css'

export default function TagInput({ tags, suggestions, onChange, disabled, contextText = '' }) {
  const [text, setText] = useState('')
  const listId = useId()
  const tagNames = tags.map((tag) => (typeof tag === 'string' ? tag : tag.name))
  const suggestionNames = suggestions.map((tag) => (typeof tag === 'string' ? tag : tag.name))
  const tagColors = new Map([...tags, ...suggestions].filter((tag) => typeof tag !== 'string').map((tag) => [tag.name, tag.color]))
  const autoSuggestions = suggestTags(suggestions, tagNames, contextText)

  function colorFor(name) {
    return tagColors.get(name)
  }

  function addTag(raw) {
    const name = raw.trim().replace(/,+$/, '').slice(0, 40)
    setText('')
    if (!name) return
    if (tagNames.some((tag) => tag.toLowerCase() === name.toLowerCase())) return
    onChange([...tagNames, name])
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag(text)
    } else if (event.key === 'Backspace' && !text && tagNames.length > 0) {
      onChange(tagNames.slice(0, -1))
    }
  }

  return (
    <div className="tag-input">
      <span className="tag-input__label">Tags</span>
      <div className="tag-input__box">
        {tagNames.map((tag) => (
          <span key={tag} className="tag-input__chip" style={{ '--tag-color': colorFor(tag) || 'var(--color-accent)' }}>
            {tag}
            <button
              type="button"
              onClick={() => onChange(tagNames.filter((item) => item !== tag))}
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
          placeholder={tagNames.length === 0 ? 'Adicionar tag' : ''}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(text)}
          aria-label="Adicionar tag"
        />
        <datalist id={listId}>
          {suggestionNames
            .filter((name) => !tagNames.includes(name))
            .map((name) => (
              <option key={name} value={name} />
            ))}
        </datalist>
      </div>
      {autoSuggestions.length > 0 && (
        <div className="tag-input__suggestions" aria-label="Sugestões automáticas de tags">
          <span>Sugestões:</span>
          {autoSuggestions.map((tag) => {
            const name = typeof tag === 'string' ? tag : tag.name
            return (
              <button key={name} type="button" onClick={() => addTag(name)} disabled={disabled}>
                {name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
