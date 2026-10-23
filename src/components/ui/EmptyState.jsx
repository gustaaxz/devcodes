import './EmptyState.css'

export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state__icon">
          <Icon size={28} strokeWidth={1.75} />
        </div>
      )}
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__description">{description}</p>
    </div>
  )
}
