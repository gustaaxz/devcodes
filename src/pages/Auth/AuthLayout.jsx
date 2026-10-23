import { Code2 } from 'lucide-react'
import './Auth.css'

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <div className="auth__card">
        <div className="auth__brand">
          <span className="auth__logo">
            <Code2 size={22} strokeWidth={2.25} />
          </span>
          <span className="auth__name">DevCodes</span>
        </div>
        <div className="auth__heading">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
        {footer && <div className="auth__footer">{footer}</div>}
      </div>
    </div>
  )
}
