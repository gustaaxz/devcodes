import { useSyncExternalStore } from 'react'
import { getActiveLocale, subscribeLocale } from '../../utils/localeStore.js'
import { translateText } from '../../utils/i18n.js'

export function LocalizedText({ value }) {
  const locale = useSyncExternalStore(subscribeLocale, getActiveLocale, () => 'pt-BR')
  return translateText(locale, value)
}
