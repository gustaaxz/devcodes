import { useId } from 'react'
import './TextField.css'

export default function TextAreaField({ label, error, ...textareaProps }) {
  const id = useId()
  return (
    <div className="text-field">
      <label htmlFor={id} className="text-field__label">
        {label}
      </label>
      <textarea
        id={id}
        className={`text-field__input text-field__textarea${error ? ' text-field__input--error' : ''}`}
        {...textareaProps}
      />
      {error && <span className="text-field__error">{error}</span>}
    </div>
  )
}
