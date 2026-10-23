import { Plus, Settings2 } from 'lucide-react'
import './CategoryTabs.css'

export default function CategoryTabs({ categories, counts, activeId, onSelect, onAdd, onManage }) {
  return (
    <div className="category-tabs">
      <div className="category-tabs__list" role="tablist" aria-label="Categorias e tecnologias">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={category.id === activeId}
            className={`category-tabs__tab${category.id === activeId ? ' category-tabs__tab--active' : ''}`}
            onClick={() => onSelect(category.id)}
          >
            {category.name}
            <span className="category-tabs__count">{counts[category.id] || 0}</span>
          </button>
        ))}
      </div>
      <div className="category-tabs__actions">
        <button type="button" className="icon-button" onClick={onAdd} aria-label="Nova categoria">
          <Plus size={18} />
        </button>
        <button type="button" className="icon-button" onClick={onManage} aria-label="Gerenciar categorias">
          <Settings2 size={18} />
        </button>
      </div>
    </div>
  )
}
