const messages = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Confirme seu e-mail antes de entrar.',
  user_already_exists: 'Já existe uma conta com este e-mail.',
  email_exists: 'Já existe uma conta com este e-mail.',
  weak_password: 'A senha é muito fraca. Utilize pelo menos 8 caracteres.',
  same_password: 'A nova senha deve ser diferente da senha atual.',
  over_request_rate_limit: 'Muitas tentativas. Aguarde alguns instantes e tente novamente.',
  over_email_send_rate_limit: 'Limite de envio de e-mails atingido. Tente novamente mais tarde.',
  session_not_found: 'Sua sessão não é mais válida. Entre novamente.',
  session_expired: 'Sua sessão expirou. Entre novamente.',
  signup_disabled: 'O cadastro de novos usuários está desativado.',
  validation_failed: 'Os dados informados são inválidos.'
}

export function translateAuthError(error) {
  if (!error) return ''
  if (error.code && messages[error.code]) return messages[error.code]
  if (error.name === 'AuthRetryableFetchError' || /failed to fetch|network/i.test(error.message || '')) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão.'
  }
  return 'Não foi possível concluir a operação. Tente novamente.'
}
