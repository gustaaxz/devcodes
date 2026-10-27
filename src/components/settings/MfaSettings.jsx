import { useEffect, useState } from 'react'
import { friendlyError } from '../../utils/errors.js'
import { enrollTotpFactor, listMfaFactors, unenrollMfaFactor, verifyMfaFactor } from '../../services/auth/authService.js'
import Alert from '../ui/Alert.jsx'
import Spinner from '../ui/Spinner.jsx'

export default function MfaSettings() {
  const [factors, setFactors] = useState([])
  const [enrollment, setEnrollment] = useState(null)
  const [code, setCode] = useState('')
  const [notice, setNotice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  async function refreshFactors() {
    const data = await listMfaFactors()
    setFactors(data.totp ?? [])
  }

  useEffect(() => {
    let active = true
    listMfaFactors()
      .then((data) => { if (active) setFactors(data.totp ?? []) })
      .catch((error) => { if (active) setNotice({ variant: 'error', text: friendlyError(error, 'Não foi possível carregar a autenticação em duas etapas.') }) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function beginEnrollment() {
    setBusy(true)
    setNotice(null)
    try {
      setEnrollment(await enrollTotpFactor())
    } catch (error) {
      setNotice({ variant: 'error', text: friendlyError(error, 'Não foi possível iniciar a configuração do autenticador.') })
    } finally {
      setBusy(false)
    }
  }

  async function confirmEnrollment(event) {
    event.preventDefault()
    if (!enrollment || !/^\d{6,8}$/.test(code.trim())) return
    setBusy(true)
    setNotice(null)
    try {
      await verifyMfaFactor({ factorId: enrollment.id, code: code.trim() })
      setEnrollment(null)
      setCode('')
      await refreshFactors()
      setNotice({ variant: 'success', text: 'Autenticação em duas etapas ativada.' })
    } catch (error) {
      setNotice({ variant: 'error', text: friendlyError(error, 'Código inválido. Confira o app autenticador e tente novamente.') })
    } finally {
      setBusy(false)
    }
  }

  async function removeFactor(factorId) {
    setBusy(true)
    setNotice(null)
    try {
      await unenrollMfaFactor(factorId)
      await refreshFactors()
      setNotice({ variant: 'success', text: 'Dispositivo removido.' })
    } catch (error) {
      setNotice({ variant: 'error', text: friendlyError(error, 'Não foi possível remover o dispositivo.') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mfa-settings">
      {notice && <Alert variant={notice.variant}>{notice.text}</Alert>}
      {loading ? <Spinner label="Carregando dispositivos" /> : (
        <>
          {factors.filter((factor) => factor.status === 'verified').map((factor) => (
            <div className="mfa-settings__factor" key={factor.id}>
              <span>{factor.friendly_name || 'App autenticador'} · ativo</span>
              <button type="button" className="button button--secondary button--small" disabled={busy} onClick={() => removeFactor(factor.id)}>
                Remover
              </button>
            </div>
          ))}
          {enrollment ? (
            <form className="mfa-settings__enroll" onSubmit={confirmEnrollment}>
              <p>Escaneie o QR code no app autenticador e informe o código de seis dígitos.</p>
              <img src={`data:image/svg+xml,${encodeURIComponent(enrollment.totp.qr_code)}`} alt="QR code para configurar autenticação em duas etapas" />
              <details>
                <summary>Inserir chave manualmente</summary>
                <code>{enrollment.totp.secret}</code>
              </details>
              <label className="mfa-settings__code-label">
                Código do autenticador
                <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" pattern="\d{6,8}" required />
              </label>
              <div className="mfa-settings__actions">
                <button type="submit" className="button button--primary" disabled={busy || code.length < 6}>{busy ? <Spinner size={16} /> : 'Confirmar ativação'}</button>
                <button type="button" className="button button--secondary" disabled={busy} onClick={() => setEnrollment(null)}>Cancelar</button>
              </div>
            </form>
          ) : (
            <>
              {!factors.some((factor) => factor.status === 'verified') && <>
                <p>Nenhum app autenticador configurado.</p>
                <button type="button" className="button button--secondary" disabled={busy} onClick={beginEnrollment}>
                  {busy ? <Spinner size={16} /> : 'Configurar app autenticador'}
                </button>
              </>}
            </>
          )}
        </>
      )}
    </div>
  )
}
