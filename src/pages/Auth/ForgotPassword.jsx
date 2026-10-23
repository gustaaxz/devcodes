import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout.jsx'
import TextField from '../../components/ui/TextField.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { translateAuthError } from '../../utils/authErrors.js'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await requestPasswordReset(email.trim())
      setSent(true)
    } catch (authError) {
      setError(translateAuthError(authError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Informe seu e-mail para receber o link de redefinição."
      footer={
        <Link to="/entrar" className="auth__link">
          Voltar para o login
        </Link>
      }
    >
      {sent ? (
        <Alert variant="success">
          Se existir uma conta com este e-mail, você receberá um link para redefinir a senha.
        </Alert>
      ) : (
        <form className="auth__form" onSubmit={handleSubmit}>
          {error && <Alert variant="error">{error}</Alert>}
          <TextField
            label="E-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <button type="submit" className="button button--primary button--block" disabled={submitting}>
            {submitting ? <Spinner size={16} /> : 'Enviar link'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
