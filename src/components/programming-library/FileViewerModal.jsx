import { useState } from 'react'
import { Check, Copy, Download, Pencil } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Alert from '../ui/Alert.jsx'
import Badge from '../ui/Badge.jsx'
import Spinner from '../ui/Spinner.jsx'
import CodeViewer from './CodeViewer.jsx'
import { FileTypeIcon } from './FileItem.jsx'
import { useLoad } from '../../hooks/useLoad.js'
import { readFileText, updateFileContent } from '../../services/files/filesService.js'
import { formatDateTime } from '../../utils/dates.js'
import { friendlyError } from '../../utils/errors.js'
import { MAX_HIGHLIGHT_SIZE, MAX_VIEW_SIZE, formatBytes, getFileType, isTextFile } from '../../utils/files.js'
import './FileViewerModal.css'

export default function FileViewerModal({ file, categoryName, onClose, onDownload, onContentSaved }) {
  const type = getFileType(file.extension || file.original_name)
  const viewable = isTextFile(file) && file.size_bytes <= MAX_VIEW_SIZE
  const content = useLoad(() => (viewable ? readFileText(file) : Promise.resolve(null)), `${file.id}-${file.updated_at}`)
  const [override, setOverride] = useState(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [copied, setCopied] = useState(false)

  const code = override ?? content.data

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setSaveError('Não foi possível copiar o conteúdo.')
    }
  }

  function startEditing() {
    setSaveError('')
    setDraft(code)
    setEditing(true)
  }

  async function handleSave() {
    setSaveError('')
    setSaving(true)
    try {
      const saved = await updateFileContent(file, draft)
      setOverride(draft)
      setEditing(false)
      onContentSaved(saved)
    } catch (error) {
      setSaveError(friendlyError(error, 'Não foi possível salvar o arquivo.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={file.original_name} onClose={onClose} xl>
      <div className="viewer">
        <div className="viewer__bar">
          <div className="viewer__badges">
            <Badge variant="accent">{type ? type.label : file.extension.toUpperCase()}</Badge>
            <Badge>{categoryName}</Badge>
            <span className="viewer__size">{formatBytes(file.size_bytes)}</span>
          </div>
          <div className="viewer__actions">
            {code !== null && !editing && (
              <button type="button" className="button button--secondary button--small" onClick={handleCopy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            )}
            {code !== null && !editing && (
              <button type="button" className="button button--secondary button--small" onClick={startEditing}>
                <Pencil size={14} />
                Editar
              </button>
            )}
            <button type="button" className="button button--primary button--small" onClick={() => onDownload(file)}>
              <Download size={14} />
              Baixar original
            </button>
          </div>
        </div>

        {saveError && <Alert variant="error">{saveError}</Alert>}

        {viewable && content.loading && !code && <Spinner label="Carregando arquivo" />}
        {viewable && content.error && code === null && <Alert variant="error">{content.error}</Alert>}

        {code !== null && !editing && (
          <CodeViewer
            code={code}
            language={type?.language ?? null}
            highlight={Boolean(type?.language) && code.length <= MAX_HIGHLIGHT_SIZE}
          />
        )}

        {editing && (
          <div className="stack">
            <textarea
              className="viewer__editor"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              spellCheck={false}
              aria-label="Conteúdo do arquivo"
            />
            <div className="modal__footer">
              <button type="button" className="button button--secondary" onClick={() => setEditing(false)} disabled={saving}>
                Cancelar
              </button>
              <button type="button" className="button button--primary" onClick={handleSave} disabled={saving}>
                {saving ? <Spinner size={16} /> : 'Salvar alterações'}
              </button>
            </div>
          </div>
        )}

        {!viewable && (
          <div className="viewer__unavailable">
            <FileTypeIcon file={file} size={32} />
            <p>
              {isTextFile(file)
                ? `Arquivo maior que ${formatBytes(MAX_VIEW_SIZE)}. Baixe o original para abri-lo.`
                : 'Este formato não possui visualização. Utilize o download para abrir o arquivo.'}
            </p>
          </div>
        )}

        <dl className="viewer__meta">
          <div>
            <dt>Tipo</dt>
            <dd>{file.mime_type || '-'}</dd>
          </div>
          <div>
            <dt>Criado em</dt>
            <dd>{formatDateTime(new Date(file.created_at))}</dd>
          </div>
          <div>
            <dt>Modificado em</dt>
            <dd>{formatDateTime(new Date(file.updated_at))}</dd>
          </div>
          {file.description && (
            <div className="viewer__meta-wide">
              <dt>Descrição</dt>
              <dd>{file.description}</dd>
            </div>
          )}
        </dl>
      </div>
    </Modal>
  )
}
