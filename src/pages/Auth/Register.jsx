import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout.jsx'
import TextField from '../../components/ui/TextField.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { translateAuthError } from '../../utils/authErrors.js'

const MIN_PASSWORD_LENGTH = 8

export default function Register() {
  const { signUp } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const next = {}
    if (!displayName.trim()) next.displayName = 'Informe seu nome.'
    if (!username.trim()) next.username = 'Informe um nome de usuário.'
    if (!/^[a-z0-9_-]{3,20}$/.test(username.trim())) {
      next.username = 'Nome de usuário deve ter 3-20 caracteres (letras, números, - e _ apenas).'
    }
    if (password.length < MIN_PASSWORD_LENGTH) next.password = `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
    if (confirmation !== password) next.confirmation = 'As senhas não coincidem.'
    return next
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    const validation = validate()
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setSubmitting(true)
    try {
      const data = await signUp({ 
        displayName: displayName.trim(), 
        email: email.trim(), 
        password,
        username: username.trim()
      })
      if (!data.session) setConfirmationSent(true)
    } catch (authError) {
      setFormError(translateAuthError(authError))
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmationSent) {
    return (
      <AuthLayout
        title="Verifique seu e-mail"
        footer={
          <Link to="/entrar" className="auth__link">
            Voltar para o login
          </Link>
        }
      >
        <Alert variant="success">
          Enviamos um link de confirmação para {email.trim()}. Confirme seu e-mail para ativar a conta.
        </Alert>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Organize seus estudos e códigos em um só lugar."
      footer={
        <span>
          Já tem conta?{' '}
          <Link to="/entrar" className="auth__link">
            Entrar
          </Link>
        </span>
      }
    >
      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        <TextField
          label="Nome"
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          error={errors.displayName}
        />
        <TextField
          label="Nome de usuário"
          autoComplete="username"
          placeholder="minhasenha_123"
          value={username}
          onChange={(event) => setUsername(event.target.value.toLowerCase())}
          error={errors.username}
        />
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <TextField
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          error={errors.confirmation}
        />
        <button type="submit" className="button button--primary button--block" disabled={submitting}>
          {submitting ? <Spinner size={16} /> : 'Criar conta'}
        </button>
      </form>
    </AuthLayout>
  )
}
