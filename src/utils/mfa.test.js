import { describe, expect, it } from 'vitest'
import { requiresMfaChallenge } from './mfa.js'

describe('MFA assurance levels', () => {
  it('requires a challenge when the session can advance from aal1 to aal2', () => {
    expect(requiresMfaChallenge('aal1', 'aal2')).toBe(true)
  })

  it('does not block an aal2 session or accounts without a second factor', () => {
    expect(requiresMfaChallenge('aal2', 'aal2')).toBe(false)
    expect(requiresMfaChallenge('aal1', 'aal1')).toBe(false)
  })
})
