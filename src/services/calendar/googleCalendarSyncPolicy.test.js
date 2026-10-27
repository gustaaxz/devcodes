import { describe, expect, it } from 'vitest'
import { compareCalendarVersions } from './googleCalendarSyncPolicy.js'

describe('Google Calendar conflict policy', () => {
  it('applies the configured DevCodes-first rule when both sides changed', () => {
    const result = compareCalendarVersions(
      { updated_at: '2026-10-27T10:00:00.000Z' },
      { local_updated_at: '2026-10-27T09:00:00.000Z', google_etag: 'etag-1', google_updated_at: '2026-10-27T09:00:00.000Z' },
      { etag: 'etag-2', updated: '2026-10-27T09:30:00.000Z' }
    )

    expect(result).toEqual({ localChanged: true, remoteChanged: true, conflict: true, winner: 'devcodes' })
  })

  it('uses Google when only the remote event changed', () => {
    expect(compareCalendarVersions(
      { updated_at: '2026-10-27T09:00:00.000Z' },
      { local_updated_at: '2026-10-27T09:00:00.000Z', google_etag: 'etag-1' },
      { etag: 'etag-2' }
    )).toMatchObject({ localChanged: false, remoteChanged: true, conflict: false, winner: 'google' })
  })

  it('keeps local edits when the remote mapping does not exist yet', () => {
    expect(compareCalendarVersions(
      { updated_at: '2026-10-27T09:00:00.000Z' },
      null,
      { etag: 'etag-1' }
    )).toMatchObject({ localChanged: true, conflict: false, winner: 'devcodes' })
  })
})
