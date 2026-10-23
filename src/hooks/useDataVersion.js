import { useContext } from 'react'
import { DataVersionContext } from '../contexts/dataVersionContext.js'

export function useDataVersion() {
  return useContext(DataVersionContext)
}
