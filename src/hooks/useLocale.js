import { useSyncExternalStore } from 'react'
import { getActiveLocale, subscribeLocale } from '../utils/localeStore.js'

export function useLocale() {
  return useSyncExternalStore(subscribeLocale, getActiveLocale, () => 'pt-BR')
}
