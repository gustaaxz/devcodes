import { useCallback, useMemo, useState } from 'react'
import { DataVersionContext } from './dataVersionContext.js'

export function DataVersionProvider({ children }) {
  const [version, setVersion] = useState(0)
  const bump = useCallback(() => setVersion((value) => value + 1), [])
  const value = useMemo(() => ({ version, bump }), [version, bump])
  return <DataVersionContext.Provider value={value}>{children}</DataVersionContext.Provider>
}
