import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useLoad } from '../../hooks/useLoad.js'
import { listAuditEntries } from '../../services/audit/auditService.js'
import { getAuditLabels } from '../../utils/audit.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useProfile } from '../../hooks/useProfile.js'
import { useLocale } from '../../hooks/useLocale.js'
import { translate } from '../../utils/i18n.js'
import Alert from '../ui/Alert.jsx'
import Spinner from '../ui/Spinner.jsx'

const FORMAT_OPTIONS = { dateStyle: 'medium', timeStyle: 'short' }

function loadEntries(userId) {
  return listAuditEntries(userId)
}

export default function AuditLogPanel() {
  const [isVisible, setIsVisible] = useState(false)
  const locale = useLocale()
  const { user } = useAuth()
  const { preferences } = useProfile()

  return (
    <div className="audit-log-panel">
      <button
        type="button"
        className="button button--secondary"
        aria-expanded={isVisible}
        aria-controls="account-audit-content"
        onClick={() => setIsVisible((visible) => !visible)}
      >
        {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        {translate(locale, isVisible ? 'Ocultar auditoria da conta' : 'Visualizar auditoria da conta')}
      </button>
      <div className="audit-log-panel__content" id="account-audit-content" hidden={!isVisible}>
        {isVisible && <AuditLogEntries userId={user.id} locale={preferences.locale} />}
      </div>
    </div>
  )
}

function AuditLogEntries({ userId, locale }) {
  const result = useLoad(() => loadEntries(userId), userId)

  if (result.loading && !result.data) return <Spinner label="Carregando histórico" />
  if (result.error) return <Alert variant="error">{result.error}</Alert>
  if (!result.data?.length) return <p>Nenhuma atividade sensível registrada ainda.</p>

  return (
    <ol className="audit-log">
      {result.data.map((entry) => {
        const labels = getAuditLabels(entry, locale)
        return (
          <li className="audit-log__entry" key={entry.id}>
            <div>
              <strong>{labels.operation} · {labels.entity}</strong>
              <span>{labels.fields.join(', ') || 'Registro'}</span>
            </div>
            <time dateTime={entry.occurred_at}>
              {new Intl.DateTimeFormat(locale, FORMAT_OPTIONS).format(new Date(entry.occurred_at))}
            </time>
            <span className="audit-log__operation">{labels.operation}</span>
          </li>
        )
      })}
    </ol>
  )
}
