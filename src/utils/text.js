import { getActiveLocale } from './localeStore.js'

export function buildSnippet(content, length = 90) {
  return content
    .replace(/[#*_-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, length)
}

export function getGreeting(date) {
  const hour = date.getHours()
  if (getActiveLocale() === 'en-US') {
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

