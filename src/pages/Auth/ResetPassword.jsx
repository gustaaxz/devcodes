import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout.jsx'
import TextField from '../../components/ui/TextField.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import FullScreenMessage from '../../components/layout/FullScreenMessage.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { translateAuthError } from '../../utils/authErrors.js'

const MIN_PASSWORD_LENGTH = 8

export default function ResetPassword() {
  const { status, recovery, updatePassword, clearRecovery } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (status === 'loading') {
    return (
      <FullScreenMessage>
        <Spinner label="Validando link" />
      </FullScreenMessage>
    )
  }

  if (status !== 'authenticated') {
    return (
      <AuthLayout
        title="Link inválido ou expirado"
        footer={
          <Link to="/recuperar-senha" className="auth__link">
            Solicitar novo link
          </Link>
        }
      >
        <Alert variant="error">Não foi possível validar o link de redefinição de senha.</Alert>
      </AuthLayout>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    const next = {}
    if (password.length < MIN_PASSWORD_LENGTH) next.password = `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
    if (confirmation !== password) next.confirmation = 'As senhas não coincidem.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      await updatePassword(password)
      clearRecovery()
      navigate('/', { replace: true })
    } catch (authError) {
      setFormError(translateAuthError(authError))
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Definir nova senha"
      subtitle={recovery ? 'Escolha uma nova senha para sua conta.' : 'Altere a senha da sua conta.'}
    >
      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        <TextField
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <TextField
          label="Confirmar nova senha"
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          error={errors.confirmation}
        />
        <button type="submit" className="button button--primary button--block" disabled={submitting}>
          {submitting ? <Spinner size={16} /> : 'Salvar senha'}
        </button>
      </form>
    </AuthLayout>
  )
}
