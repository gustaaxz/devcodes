import { useId } from 'react'
import './TextField.css'

export default function SelectField({ label, options, placeholder, error, ...selectProps }) {
  const id = useId()
  return (
    <div className="text-field">
      {label && (
        <label htmlFor={id} className="text-field__label">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`text-field__input text-field__select${error ? ' text-field__input--error' : ''}`}
        {...selectProps}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-field__error">{error}</span>}
    </div>
  )
}
