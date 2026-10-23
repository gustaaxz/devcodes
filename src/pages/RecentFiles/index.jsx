import { useState } from 'react'
import { Clock } from 'lucide-react'
import FileLinkRow from '../../components/programming-library/FileLinkRow.jsx'
import Alert from '../../components/ui/Alert.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { useDataVersion } from '../../hooks/useDataVersion.js'
import { useLoad } from '../../hooks/useLoad.js'
import { downloadFile, listRecentFiles, updateFileRecord } from '../../services/files/filesService.js'
import { friendlyError } from '../../utils/errors.js'

export default function RecentFiles() {
  const { version } = useDataVersion()
  const { data, loading, error, reload } = useLoad(() => listRecentFiles(30), version)
  const [actionError, setActionError] = useState('')

  async function handleToggleFavorite(file) {
    setActionError('')
    try {
      await updateFileRecord(file.id, { is_favorite: !file.is_favorite })
      reload()
    } catch (toggleError) {
      setActionError(friendlyError(toggleError, 'Não foi possível atualizar o favorito.'))
    }
  }

  async function handleDownload(file) {
    setActionError('')
    try {
      await downloadFile(file)
    } catch (downloadError) {
      setActionError(friendlyError(downloadError, 'Não foi possível gerar o link de download.'))
    }
  }

  if (loading && !data) return <Spinner label="Carregando arquivos" />
  if (!data) return <Alert variant="error">{error || 'Não foi possível carregar os arquivos.'}</Alert>

  return (
    <div className="stack">
      {error && <Alert variant="error">{error}</Alert>}
      {actionError && <Alert variant="error">{actionError}</Alert>}
      {data.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Nenhum arquivo recente"
          description="Os arquivos enviados ou modificados na Biblioteca de Programação aparecerão aqui."
        />
      ) : (
        <div className="stack" style={{ gap: 'var(--space-3)' }}>
          {data.map((file) => (
            <FileLinkRow
              key={file.id}
              file={file}
              onToggleFavorite={handleToggleFavorite}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}
    </div>
  )
}
