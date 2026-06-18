export type SupportedLanguage = 'en' | 'id' | 'de' | 'ja' | 'nl'
export type LocalizedString = Record<SupportedLanguage, string>

export const languages: { code: SupportedLanguage; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'id', name: 'Indonesian' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'nl', name: 'Dutch' }
]

export const defaultLang: SupportedLanguage = 'en'

export function getEmptyLocalized(): LocalizedString {
  return { en: '', id: '', de: '', ja: '', nl: '' }
}

// Parses a potentially localized string. If it's valid JSON, it returns the object. 
// If it's a plain string, it wraps it in { en: string }. 
export function parseLocal(val: any): LocalizedString {
  const defaultObj = getEmptyLocalized()
  if (!val) return defaultObj

  if (typeof val === 'object' && val !== null) {
    return { ...defaultObj, ...val }
  }

  try {
    const parsed = JSON.parse(val)
    if (typeof parsed === 'object' && parsed !== null) {
      return { ...defaultObj, ...parsed }
    }
  } catch (e) {
    // Legacy plain string fallback
    return { ...defaultObj, [defaultLang]: String(val) }
  }
  return { ...defaultObj, [defaultLang]: String(val) }
}

// Stringifies the localized object.
export function stringifyLocal(obj: LocalizedString): string {
  // optionally clean up empty strings before saving to save space
  const cleaned: Partial<LocalizedString> = {}
  let hasValue = false
  ;(Object.keys(obj) as SupportedLanguage[]).forEach(key => {
    if (obj[key] && obj[key].trim() !== '') {
      cleaned[key] = obj[key]
      hasValue = true
    }
  })
  
  // fallback to en if completely empty so we don't save empty object '{}'
  if (!hasValue) {
    cleaned[defaultLang] = ''
  }
  return JSON.stringify(cleaned)
}

// Helper to get fallback text for tables/display
// E.g getLocalText('{"en": "Hello"}') -> "Hello"
export function getDisplayLocal(val: any, preferredLang: string = defaultLang): string {
  if (!val) return ''

  if (typeof val === 'object' && val !== null) {
    return val[preferredLang] || val[defaultLang] || Object.values(val)[0] || ''
  }

  try {
    const parsed = JSON.parse(val)
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed[preferredLang] || parsed[defaultLang] || Object.values(parsed)[0] || ''
    }
  } catch (e) {
    return String(val)
  }
  return String(val)
}
