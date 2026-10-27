import { Download, Eye, File, FileArchive, FileCode2, FileText, Image as ImageIcon, Pencil, Star, Trash2 } from 'lucide-react'
import { formatShortDate } from '../../utils/dates.js'
import { formatBytes, getFileType } from '../../utils/files.js'
import './FileItem.css'

export function FileTypeIcon({ file, size = 22 }) {
  const type = getFileType(file.extension || file.original_name)
  const props = { size, strokeWidth: 1.75 }
  if (!type) return <File {...props} />
  if (type.kind === 'image') return <ImageIcon {...props} />
  if (type.kind === 'text') return type.language ? <FileCode2 {...props} /> : <FileText {...props} />
  if (file.extension === 'zip') return <FileArchive {...props} />
  return <FileText {...props} />
}

export default function FileItem({ file, layout, onView, onDownload, onEdit, onDelete, onToggleFavorite }) {
  const type = getFileType(file.extension || file.original_name)

  return (
    <article className={`file-item file-item--${layout}`}>
      <button type="button" className="file-item__main" onClick={() => onView(file)}>
        <span className="file-item__icon">
          <FileTypeIcon file={file} />
        </span>
        <span className="file-item__info">
          <strong>{file.original_name}</strong>
          <span className="file-item__meta">
            {type ? type.label : file.extension.toUpperCase()} · {formatBytes(file.size_bytes)} ·{' '}
            {formatShortDate(new Date(file.created_at))}
          </span>
          {file.description && <span className="file-item__description">{file.description}</span>}
        </span>
      </button>
      <div className="file-item__actions">
        <button
          type="button"
          className={`icon-button${file.is_favorite ? ' icon-button--active' : ''}`}
          onClick={() => onToggleFavorite(file)}
          aria-label={file.is_favorite ? 'Remover dos favoritos' : 'Favoritar'}
          aria-pressed={file.is_favorite}
        >
          <Star size={17} />
        </button>
        <button type="button" className="icon-button" onClick={() => onView(file)} aria-label="Visualizar">
          <Eye size={17} />
        </button>
        <button type="button" className="icon-button" onClick={() => onDownload(file)} aria-label="Baixar">
          <Download size={17} />
        </button>
        <button type="button" className="icon-button" onClick={() => onEdit(file)} aria-label="Editar detalhes">
          <Pencil size={17} />
        </button>
        <button type="button" className="icon-button" onClick={() => onDelete(file)} aria-label="Excluir">
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  )
}
