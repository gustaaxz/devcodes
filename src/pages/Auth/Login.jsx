import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout.jsx'
import TextField from '../../components/ui/TextField.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { translateAuthError } from '../../utils/authErrors.js'

export default function Login() {
  const { signIn, sessionExpired } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn({ email: identifier.trim(), password })
    } catch (authError) {
      setError(translateAuthError(authError))
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse sua conta para continuar."
      footer={
        <>
          <Link to="/recuperar-senha" className="auth__link">
            Esqueci minha senha
          </Link>
          <span>
            Não tem conta?{' '}
            <Link to="/cadastro" className="auth__link">
              Cadastre-se
            </Link>
          </span>
        </>
      }
    >
      <form className="auth__form" onSubmit={handleSubmit}>
        {sessionExpired && <Alert variant="info">Sua sessão expirou. Entre novamente.</Alert>}
        {error && <Alert variant="error">{error}</Alert>}
        <TextField
          label="E-mail ou nome de usuário"
          autoComplete="username"
          placeholder="seu_usuario ou seu@email.com"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button type="submit" className="button button--primary button--block" disabled={submitting}>
          {submitting ? <Spinner size={16} /> : 'Entrar'}
        </button>
      </form>
    </AuthLayout>
  )
}
