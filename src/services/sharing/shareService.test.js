import { describe, expect, it, vi } from 'vitest'
import {
  generateNotePublicLink,
  shareNoteWithUser,
  getSharedNote,
  copySharedNoteToLibrary,
} from './shareService.js'

// Mock supabase client
vi.mock('../supabase/client.js', () => {
  return {
    supabase: {
      from: vi.fn(),
      rpc: vi.fn(),
    },
  }
})

import { supabase } from '../supabase/client.js'

describe('shareService', () => {
  it('throws error when sharing with oneself', async () => {
    supabase.rpc.mockResolvedValueOnce({ data: 'user-123', error: null })

    await expect(
      shareNoteWithUser('note-1', 'user-123', 'same@user.com')
    ).rejects.toThrow('Você não pode compartilhar com você mesmo.')
  })

  it('throws error when email does not exist', async () => {
    supabase.rpc.mockResolvedValueOnce({ data: null, error: null })

    await expect(
      shareNoteWithUser('note-1', 'user-123', 'notfound@user.com')
    ).rejects.toThrow('Nenhum usuário cadastrado com este e-mail.')
  })

  it('creates a public share link successfully', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 's1', share_token: 'token-xyz', permission: 'view', expires_at: null },
          error: null,
        }),
      }),
    })
    supabase.from.mockReturnValueOnce({ insert: mockInsert })

    const result = await generateNotePublicLink('note-1', 'user-owner')
    expect(result.share_token).toBe('token-xyz')
    expect(result.permission).toBe('view')
  })

  it('rejects expired note link in getSharedNote fallback', async () => {
    // RPC fails or not deployed
    supabase.rpc.mockResolvedValueOnce({ data: null, error: new Error('function not found') })

    const expiredDate = new Date(Date.now() - 3600000).toISOString()
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 's1', permission: 'view', expires_at: expiredDate, note_id: 'n1' },
          error: null,
        }),
      }),
    })
    supabase.from.mockReturnValueOnce({ select: mockSelect })

    await expect(getSharedNote('expired-token')).rejects.toThrow('Este link de compartilhamento expirou.')
  })

  it('copies shared note with (Cópia) in title', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'new-n1', title: 'Minha Anotação (Cópia)' },
          error: null,
        }),
      }),
    })
    supabase.from.mockReturnValueOnce({ insert: mockInsert })

    const result = await copySharedNoteToLibrary(
      { title: 'Minha Anotação', content: '# Hello' },
      'user-target'
    )
    expect(result.title).toBe('Minha Anotação (Cópia)')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Minha Anotação (Cópia)',
        user_id: 'user-target',
        content: '# Hello',
      })
    )
  })
})
