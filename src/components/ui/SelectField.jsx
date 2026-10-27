import { useId } from 'react'
import { useLocale } from '../../hooks/useLocale.js'
import { translateText } from '../../utils/i18n.js'
import './TextField.css'

export default function SelectField({ label, options, placeholder, error, ...selectProps }) {
  const id = useId()
  const locale = useLocale()
  return (
    <div className="text-field">
      {label && (
        <label htmlFor={id} className="text-field__label">
          {typeof label === 'string' ? translateText(locale, label) : label}
        </label>
      )}
      <select
        id={id}
        className={`text-field__input text-field__select${error ? ' text-field__input--error' : ''}`}
        {...selectProps}
      >
        {placeholder !== undefined && <option value="">{translateText(locale, placeholder)}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {translateText(locale, option.label)}
          </option>
        ))}
      </select>
      {error && <span className="text-field__error">{error}</span>}
    </div>
  )
}
