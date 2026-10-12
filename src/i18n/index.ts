import { useSettingsStore } from '../store/settingsStore'
import type { Locale } from './locale'
import { common } from './strings/common'
import { flow } from './strings/flow'
import { gallery } from './strings/gallery'
import { hud } from './strings/hud'
import { menu } from './strings/menu'
import { messages } from './strings/messages'
import { settings } from './strings/settings'

export type { Locale } from './locale'
export { LOCALES, LOCALE_NAMES, detectLocale, pick } from './locale'

/**
 * Interface strings, one namespace per area of the game:
 *
 *   const s = useStrings()      // React: re-renders when the language changes
 *   s.menu.newGame
 *   strings().messages.heroDown // stores, sim and other non-React code
 *
 * Content data (realms, story, achievements...) lives with its module and is
 * read through accessors that take the locale, e.g. `biomeTitle(index, locale)`.
 */
const NAMESPACES = { common, flow, gallery, hud, menu, messages, settings }

export type Strings = { [K in keyof typeof NAMESPACES]: (typeof NAMESPACES)[K]['tr'] }

const cache = new Map<Locale, Strings>()

export function stringsFor(locale: Locale): Strings {
  let resolved = cache.get(locale)
  if (!resolved) {
    resolved = Object.fromEntries(Object.entries(NAMESPACES).map(([name, table]) => [name, table[locale]])) as Strings
    cache.set(locale, resolved)
  }
  return resolved
}

export const currentLocale = (): Locale => useSettingsStore.getState().language
export const strings = () => stringsFor(currentLocale())
export const useLocale = () => useSettingsStore((state) => state.language)
export const useStrings = () => stringsFor(useLocale())
