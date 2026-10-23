export class ValidationError extends Error {}

export function friendlyError(error, fallback = 'Não foi possível concluir a operação. Tente novamente.') {
  if (error instanceof ValidationError) return error.message
  const message = error?.message || ''
  if (/failed to fetch|network/i.test(message)) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão.'
  }
  if (error?.code === '42501' || /row-level security|permission denied/i.test(message)) {
    return 'Você não tem permissão para realizar esta operação.'
  }
  if (error?.code === '23505') {
    return 'Já existe um registro com estes dados.'
  }
  return fallback
}
