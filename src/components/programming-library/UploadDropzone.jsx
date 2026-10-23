import { useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, UploadCloud, X } from 'lucide-react'
import { uploadFile } from '../../services/files/filesService.js'
import { ACCEPT_ATTRIBUTE, MAX_FILE_SIZE, formatBytes } from '../../utils/files.js'
import { friendlyError } from '../../utils/errors.js'
import './UploadDropzone.css'

const STATUS_ICONS = {
  uploading: <Loader2 size={16} className="upload__spin" />,
  done: <CheckCircle2 size={16} />,
  error: <AlertCircle size={16} />
}

const STATUS_LABELS = {
  queued: 'Na fila',
  uploading: 'Enviando',
  done: 'Enviado',
  error: 'Falhou'
}

export default function UploadDropzone({ userId, categoryId, categoryName, onUploaded }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [items, setItems] = useState([])
  const [running, setRunning] = useState(false)

  function updateItem(id, patch) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  async function processFiles(fileList) {
    const files = Array.from(fileList)
    if (files.length === 0 || running) return

    const entries = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      status: 'queued',
      message: ''
    }))
    setItems(entries)
    setRunning(true)

    let uploaded = 0
    for (const entry of entries) {
      updateItem(entry.id, { status: 'uploading' })
      try {
        await uploadFile({ userId, categoryId, file: entry.file })
        updateItem(entry.id, { status: 'done' })
        uploaded += 1
      } catch (error) {
        updateItem(entry.id, { status: 'error', message: friendlyError(error, 'Falha no envio.') })
      }
    }

    setRunning(false)
    if (uploaded > 0) onUploaded()
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    processFiles(event.dataTransfer.files)
  }

  function handleInputChange(event) {
    processFiles(event.target.files)
    event.target.value = ''
  }

  return (
    <div className="upload">
      <div
        className={`upload__zone${dragging ? ' upload__zone--active' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false)
        }}
        onDrop={handleDrop}
      >
        <UploadCloud size={28} strokeWidth={1.75} />
        <p>
          Arraste arquivos para enviar a <strong>{categoryName}</strong>
        </p>
        <span>Limite de {formatBytes(MAX_FILE_SIZE)} por arquivo</span>
        <button
          type="button"
          className="button button--secondary button--small"
          onClick={() => inputRef.current.click()}
          disabled={running}
        >
          Selecionar arquivos
        </button>
        <input ref={inputRef} type="file" multiple accept={ACCEPT_ATTRIBUTE} hidden onChange={handleInputChange} />
      </div>

      {items.length > 0 && (
        <div className="upload__queue">
          <ul>
            {items.map((item) => (
              <li key={item.id} className={`upload__item upload__item--${item.status}`}>
                <span className="upload__status-icon">{STATUS_ICONS[item.status]}</span>
                <span className="upload__name">{item.name}</span>
                <span className="upload__size">{formatBytes(item.size)}</span>
                <span className="upload__result">{item.status === 'error' ? item.message : STATUS_LABELS[item.status]}</span>
              </li>
            ))}
          </ul>
          {!running && (
            <button type="button" className="icon-button upload__clear" onClick={() => setItems([])} aria-label="Limpar lista">
              <X size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
