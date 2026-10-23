import { useId } from 'react'
import './TextField.css'

export default function TextField({ label, error, ...inputProps }) {
  const id = useId()
  return (
    <div className="text-field">
      <label htmlFor={id} className="text-field__label">
        {label}
      </label>
      <input
        id={id}
        className={`text-field__input${error ? ' text-field__input--error' : ''}`}
        aria-invalid={Boolean(error)}
        {...inputProps}
      />
      {error && <span className="text-field__error">{error}</span>}
    </div>
  )
}
