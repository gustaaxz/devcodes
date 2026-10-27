export const THEME_CACHE_KEY = 'devcodes-theme'

export const DEFAULT_PREFERENCES = {
  theme: 'dark',
  calendar: { weekStart: 0 },
  library: { layout: 'list', sort: 'recent' },
  onboardingCompleted: false,
  locale: 'pt-BR'
}

const THEMES = ['dark', 'light']
const LAYOUTS = ['list', 'grid']
const SORTS = ['recent', 'modified', 'name', 'size']
const LOCALES = ['pt-BR', 'en-US']

export function normalizePreferences(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const calendar = source.calendar || {}
  const library = source.library || {}
  return {
    theme: THEMES.includes(source.theme) ? source.theme : DEFAULT_PREFERENCES.theme,
    calendar: {
      weekStart: calendar.weekStart === 1 ? 1 : 0
    },
    library: {
      layout: LAYOUTS.includes(library.layout) ? library.layout : DEFAULT_PREFERENCES.library.layout,
      sort: SORTS.includes(library.sort) ? library.sort : DEFAULT_PREFERENCES.library.sort
    },
    onboardingCompleted: source.onboardingCompleted === true,
    locale: LOCALES.includes(source.locale) ? source.locale : DEFAULT_PREFERENCES.locale
  }
}

export function mergePreferences(current, patch) {
  return normalizePreferences({
    ...current,
    ...patch,
    calendar: { ...current.calendar, ...patch.calendar },
    library: { ...current.library, ...patch.library }
  })
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    window.localStorage.setItem(THEME_CACHE_KEY, theme)
  } catch {
    return
  }
}

export function readCachedTheme() {
  try {
    const cached = window.localStorage.getItem(THEME_CACHE_KEY)
    return THEMES.includes(cached) ? cached : DEFAULT_PREFERENCES.theme
  } catch {
    return DEFAULT_PREFERENCES.theme
  }
}
