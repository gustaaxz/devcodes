import { useState } from 'react'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import Alert from '../ui/Alert.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useDataVersion } from '../../hooks/useDataVersion.js'
import { importDataRecords } from '../../services/import/importService.js'
import { MAX_IMPORT_FILE_SIZE, parseImportData } from '../../services/import/importData.js'
import { friendlyError } from '../../utils/errors.js'
import './DataImportPanel.css'

function formatCounts(counts) {
  return `${counts.notes} notas, ${counts.tasks} tarefas e ${counts.events} eventos`
}

export default function DataImportPanel() {
  const { user } = useAuth()
  const { bump } = useDataVersion()
  const [fileName, setFileName] = useState('')
  const [preview, setPreview] = useState(null)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [importing, setImporting] = useState(false)

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    setPreview(null)
    setSummary(null)
    setError('')
    setFileName(file?.name || '')
    if (!file) return
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      setError('O arquivo excede o limite de 10 MB.')
      return
    }

    try {
      setPreview(parseImportData(await file.text(), file.name))
    } catch (parseError) {
      setError(parseError.message || 'Não foi possível ler o arquivo.')
    }
  }

  async function handleImport() {
    if (!preview || preview.validCount === 0) return
    setError('')
    setImporting(true)
    try {
      const result = await importDataRecords(preview.records, user.id)
      const importedCount = Object.values(result.imported).reduce((total, count) => total + count, 0)
      if (importedCount > 0) bump()
      setSummary({ ...result, validationErrors: preview.errors })
      setPreview(null)
      setConfirming(false)
    } catch (importError) {
      setError(friendlyError(importError, 'Não foi possível importar os dados.'))
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="data-import">
      <p className="data-import__description">
        Importe um backup JSON completo do DevCodes ou os CSV/JSON individuais de notas, tarefas e eventos exportados pelo app.
        A importação acrescenta registros e ignora IDs e identificadores de usuários vindos do arquivo.
      </p>
      <label className="data-import__file-label">
        <span>Arquivo de backup (máx. 10 MB)</span>
        <input type="file" accept=".json,.csv,application/json,text/csv" onChange={handleFileChange} />
      </label>
      {fileName && <p className="data-import__filename">Selecionado: {fileName}</p>}
      {error && <Alert variant="error">{error}</Alert>}

      {preview && (
        <div className="data-import__preview">
          <strong>{preview.validCount} registros prontos para importar</strong>
          <span>{formatCounts(preview.counts)}</span>
          {preview.errors.length > 0 && (
            <div className="data-import__row-errors" role="status">
              <span>{preview.errors.length} linha(s) com erro serão ignoradas:</span>
              <ul>
                {preview.errors.slice(0, 5).map((rowError, index) => (
                  <li key={`${rowError.dataset}-${rowError.row}-${index}`}>
                    {rowError.dataset}, linha {rowError.row}: {rowError.message}
                  </li>
                ))}
              </ul>
              {preview.errors.length > 5 && <span>Mais {preview.errors.length - 5} erro(s).</span>}
            </div>
          )}
          <button
            type="button"
            className="button button--primary"
            disabled={preview.validCount === 0}
            onClick={() => setConfirming(true)}
          >
            Importar dados válidos
          </button>
        </div>
      )}

      {summary && (
        <div className="data-import__summary">
          <Alert variant="success">Importados: {formatCounts(summary.imported)}.</Alert>
          {summary.errors.map((rowError, index) => (
            <Alert key={`${rowError.dataset}-${rowError.row}-${index}`} variant="error">
              {rowError.dataset}, linha {rowError.row}: {rowError.message}
            </Alert>
          ))}
          {summary.validationErrors.length > 0 && (
            <Alert variant="info">{summary.validationErrors.length} linha(s) inválida(s) foram ignoradas.</Alert>
          )}
          {summary.warnings.map((warning, index) => (
            <Alert key={`${warning.dataset}-${warning.row}-${index}`} variant="info">{warning.message}</Alert>
          ))}
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          title="Confirmar importação"
          message={`Serão adicionados ${preview.validCount} registros (${formatCounts(preview.counts)}). Registros existentes não serão alterados ou removidos. Reimportar o mesmo arquivo pode criar duplicatas.`}
          confirmLabel="Importar"
          busy={importing}
          error={error}
          onConfirm={handleImport}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}
