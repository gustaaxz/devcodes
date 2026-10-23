import { Link } from 'react-router-dom'
import { Download, Star } from 'lucide-react'
import { FileTypeIcon } from './FileItem.jsx'
import { formatShortDate } from '../../utils/dates.js'
import { formatBytes } from '../../utils/files.js'
import './FileLinkRow.css'

export default function FileLinkRow({ file, dateField = 'updated_at', onToggleFavorite, onDownload }) {
  const categoryName = file.programming_categories?.name

  return (
    <article className="file-link-row">
      <Link to={`/biblioteca?arquivo=${file.id}`} className="file-link-row__main">
        <span className="file-link-row__icon">
          <FileTypeIcon file={file} size={20} />
        </span>
        <span className="file-link-row__info">
          <strong>{file.original_name}</strong>
          <span>
            {categoryName ? `${categoryName} · ` : ''}
            {formatBytes(file.size_bytes)} · {formatShortDate(new Date(file[dateField]))}
          </span>
        </span>
      </Link>
      <div className="file-link-row__actions">
        {onToggleFavorite && (
          <button
            type="button"
            className={`icon-button${file.is_favorite ? ' icon-button--active' : ''}`}
            onClick={() => onToggleFavorite(file)}
            aria-label={file.is_favorite ? 'Remover dos favoritos' : 'Favoritar'}
            aria-pressed={file.is_favorite}
          >
            <Star size={17} />
          </button>
        )}
        {onDownload && (
          <button type="button" className="icon-button" onClick={() => onDownload(file)} aria-label="Baixar">
            <Download size={17} />
          </button>
        )}
      </div>
    </article>
  )
}
