import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { getMfaAssuranceLevel, listMfaFactors, verifyMfaFactor } from '../../services/auth/authService.js'
import { friendlyError } from '../../utils/errors.js'
import { requiresMfaChallenge } from '../../utils/mfa.js'
import { useAuth } from '../../hooks/useAuth.js'
import Alert from '../ui/Alert.jsx'
import Spinner from '../ui/Spinner.jsx'
import FullScreenMessage from './FullScreenMessage.jsx'

export default function ProtectedRoute() {
  const { status, session } = useAuth()
  const [mfaState, setMfaState] = useState({ checking: true, factor: null, error: null })
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    let active = true
    async function checkMfa() {
      setMfaState({ checking: true, factor: null, error: null })
      try {
        const [assurance, factorData] = await Promise.all([getMfaAssuranceLevel(), listMfaFactors()])
        const factors = [...(factorData.totp ?? []), ...(factorData.phone ?? [])]
        const factor = factors.find((item) => item.status === 'verified') ?? null
        const challengeRequired = requiresMfaChallenge(assurance.currentLevel, assurance.nextLevel)
        if (active) {
          setMfaState({
            checking: false,
            factor: challengeRequired ? factor : null,
            error: challengeRequired && !factor ? 'Sua conta exige um segundo fator, mas nenhum dispositivo ativo foi encontrado. Verifique as configurações da conta.' : null
          })
        }
      } catch (error) {
        if (active) setMfaState({ checking: false, factor: null, error: friendlyError(error, 'Não foi possível verificar a autenticação em duas etapas.') })
      }
    }

    if (status === 'authenticated') checkMfa()
    return () => { active = false }
  }, [status, session?.access_token])

  async function submitMfaCode(event) {
    event.preventDefault()
    if (!mfaState.factor || !/^\d{6,8}$/.test(code)) return
    setVerifying(true)
    try {
      await verifyMfaFactor({ factorId: mfaState.factor.id, code })
      setCode('')
      const assurance = await getMfaAssuranceLevel()
      if (requiresMfaChallenge(assurance.currentLevel, assurance.nextLevel)) {
        setMfaState((state) => ({ ...state, error: 'O código não elevou o nível da sessão. Tente novamente.' }))
      } else {
        setMfaState({ checking: false, factor: null, error: null })
      }
    } catch (error) {
      setMfaState((state) => ({ ...state, error: friendlyError(error, 'Código inválido. Confira o app autenticador e tente novamente.') }))
    } finally {
      setVerifying(false)
    }
  }

  if (status === 'loading') {
    return (
      <FullScreenMessage>
        <Spinner label="Carregando sessão" />
      </FullScreenMessage>
    )
  }

  if (status !== 'authenticated') return <Navigate to="/entrar" replace />
  if (mfaState.checking) {
    return <FullScreenMessage><Spinner label="Verificando autenticação" /></FullScreenMessage>
  }
  if (mfaState.error && !mfaState.factor) {
    return <FullScreenMessage><Alert variant="error">{mfaState.error}</Alert></FullScreenMessage>
  }
  if (mfaState.factor) {
    return (
      <FullScreenMessage>
        <form className="mfa-challenge" onSubmit={submitMfaCode}>
          <h1>Confirme sua identidade</h1>
          <p>Informe o código do dispositivo de autenticação em duas etapas para continuar.</p>
          {mfaState.error && <Alert variant="error">{mfaState.error}</Alert>}
          <label>
            Código de verificação
            <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" pattern="\d{6,8}" required autoFocus />
          </label>
          <button type="submit" className="button button--primary" disabled={verifying || code.length < 6}>
            {verifying ? <Spinner size={16} /> : 'Verificar e continuar'}
          </button>
        </form>
      </FullScreenMessage>
    )
  }

  return <Outlet />
}
