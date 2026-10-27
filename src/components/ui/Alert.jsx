import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { useLocale } from '../../hooks/useLocale.js'
import { translateText } from '../../utils/i18n.js'
import './Alert.css'

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info
}

export default function Alert({ variant = 'info', children }) {
  const locale = useLocale()
  const Icon = icons[variant]
  return (
    <div className={`alert alert--${variant}`} role={variant === 'error' ? 'alert' : 'status'}>
      <Icon size={18} />
      <span>{typeof children === 'string' ? translateText(locale, children) : children}</span>
    </div>
  )
}
