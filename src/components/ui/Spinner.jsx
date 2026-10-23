import { Loader2 } from 'lucide-react'
import './Spinner.css'

export default function Spinner({ size = 20, label }) {
  return (
    <span className="spinner" role="status" aria-live="polite">
      <Loader2 size={size} className="spinner__icon" />
      {label && <span className="spinner__label">{label}</span>}
    </span>
  )
}
