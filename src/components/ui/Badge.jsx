import './Badge.css'

export default function Badge({ variant = 'neutral', color, children }) {
  return (
    <span className={`badge badge--${variant}`} style={color ? { '--badge-color': color } : undefined}>
      {children}
    </span>
  )
}
