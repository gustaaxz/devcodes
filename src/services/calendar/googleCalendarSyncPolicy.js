export function compareCalendarVersions(local, mapping, remote) {
  const localUpdated = local?.updated_at ? new Date(local.updated_at).getTime() : 0
  const lastLocalUpdated = mapping?.local_updated_at ? new Date(mapping.local_updated_at).getTime() : 0
  const localChanged = !mapping?.local_updated_at || localUpdated > lastLocalUpdated
  const remoteChanged = Boolean(
    (mapping?.google_etag && remote?.etag && mapping.google_etag !== remote.etag) ||
    (mapping?.google_updated_at && remote?.updated && new Date(remote.updated).getTime() > new Date(mapping.google_updated_at).getTime())
  )

  return {
    localChanged,
    remoteChanged,
    conflict: localChanged && remoteChanged,
    winner: localChanged ? 'devcodes' : remoteChanged ? 'google' : 'unchanged'
  }
}
