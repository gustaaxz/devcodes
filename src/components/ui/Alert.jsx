import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import './Alert.css'

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info
}

export default function Alert({ variant = 'info', children }) {
  const Icon = icons[variant]
  return (
    <div className={`alert alert--${variant}`} role={variant === 'error' ? 'alert' : 'status'}>
      <Icon size={18} />
      <span>{children}</span>
    </div>
  )
}
