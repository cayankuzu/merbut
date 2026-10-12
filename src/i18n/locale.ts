/**
 * The languages Merbut ships in. Data modules import only this file (never the
 * i18n index, which depends on the settings store) and take the locale as a
 * parameter, so there is no import cycle between content and settings.
 */
export type Locale = 'tr' | 'en'

export const LOCALES: readonly Locale[] = ['tr', 'en']

/** Each language names itself, so a player can always find their own. */
export const LOCALE_NAMES: Record<Locale, string> = { tr: 'Türkçe', en: 'English' }

/** First visit: Turkish browsers get Turkish, everyone else English. */
export function detectLocale(): Locale {
  try {
    const language = typeof navigator === 'undefined' ? 'tr' : (navigator.languages?.[0] ?? navigator.language ?? 'tr')
    return language.toLowerCase().startsWith('tr') ? 'tr' : 'en'
  } catch {
    return 'tr'
  }
}

/** Picks the text for a locale, falling back to Turkish while a translation is missing. */
export function pick<T>(locale: Locale, tr: T, en: T | undefined): T {
  return locale === 'en' && en !== undefined ? en : tr
}
