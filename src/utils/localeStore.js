const STORAGE_KEY = 'devcodes.locale'
const SUPPORTED_LOCALES = ['pt-BR', 'en-US']
const listeners = new Set()

function readLocale() {
  try {
    const locale = window.localStorage.getItem(STORAGE_KEY)
    return SUPPORTED_LOCALES.includes(locale) ? locale : 'pt-BR'
  } catch {
    return 'pt-BR'
  }
}

let activeLocale = typeof window === 'undefined' ? 'pt-BR' : readLocale()

export function getActiveLocale() {
  return activeLocale
}

export function subscribeLocale(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setActiveLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale) || locale === activeLocale) return
  activeLocale = locale
  try {
    window.localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // The in-memory locale remains active for this session.
  }
  listeners.forEach((listener) => listener())
}
