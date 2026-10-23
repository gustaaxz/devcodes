import { describe, expect, it } from 'vitest'
import { translateAuthError } from './authErrors.js'
import { ValidationError, friendlyError } from './errors.js'

describe('mensagens de erro', () => {
  it('traduz erros de autenticacao conhecidos', () => {
    expect(translateAuthError({ code: 'invalid_credentials' })).toBe('E-mail ou senha incorretos.')
    expect(translateAuthError({ code: 'user_already_exists' })).toBe('Já existe uma conta com este e-mail.')
    expect(translateAuthError({ code: 'session_expired' })).toBe('Sua sessão expirou. Entre novamente.')
  })

  it('usa mensagem de rede e mensagem generica', () => {
    expect(translateAuthError({ name: 'AuthRetryableFetchError', message: 'x' })).toMatch(/conectar/)
    expect(translateAuthError({ code: 'desconhecido' })).toMatch(/Tente novamente/)
    expect(translateAuthError(null)).toBe('')
  })

  it('diferencia validacao, rede, permissao e duplicidade', () => {
    expect(friendlyError(new ValidationError('Campo invalido.'))).toBe('Campo invalido.')
    expect(friendlyError({ message: 'Failed to fetch' })).toMatch(/conectar/)
    expect(friendlyError({ code: '42501' })).toMatch(/permissão/)
    expect(friendlyError({ message: 'new row violates row-level security policy' })).toMatch(/permissão/)
    expect(friendlyError({ code: '23505' })).toMatch(/Já existe/)
    expect(friendlyError({}, 'Falha personalizada.')).toBe('Falha personalizada.')
  })
})
