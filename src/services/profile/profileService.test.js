import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getProfile, saveProfile } from './profileService.js'

vi.mock('../supabase/client.js', () => ({
  supabase: { from: vi.fn() }
}))

import { supabase } from '../supabase/client.js'

describe('profileService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads the full_name field used by the profile context', async () => {
    const profile = { full_name: 'Ada', preferences: {} }
    const maybeSingle = vi.fn().mockResolvedValue({ data: profile, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    supabase.from.mockReturnValueOnce({ select })

    await expect(getProfile('user-1')).resolves.toEqual(profile)
    expect(supabase.from).toHaveBeenCalledWith('profiles')
    expect(select).toHaveBeenCalledWith('full_name, preferences')
    expect(eq).toHaveBeenCalledWith('id', 'user-1')
  })

  it('saves profile fields and returns full_name', async () => {
    const profile = { full_name: 'Ada', preferences: {} }
    const single = vi.fn().mockResolvedValue({ data: profile, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const upsert = vi.fn().mockReturnValue({ select })
    supabase.from.mockReturnValueOnce({ upsert })

    await expect(saveProfile('user-1', { full_name: 'Ada' })).resolves.toEqual(profile)
    expect(upsert).toHaveBeenCalledWith({ id: 'user-1', full_name: 'Ada' }, { onConflict: 'id' })
    expect(select).toHaveBeenCalledWith('full_name, preferences')
  })
})
