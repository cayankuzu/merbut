import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { CHARACTERS } from '../config/gameConfig'
import { detectLocale, LOCALES, type Locale } from '../i18n/locale'
import type { CharacterId } from '../types/character'
import type { PlayerAction, PlayerBindings } from '../types/controls'
import { safeStorage } from '../utils/safeStorage'

export type DialogueSpeed = 'slow' | 'normal' | 'fast' | 'instant'
export type TextScale = 1 | 1.15 | 1.3

export const DEFAULT_BINDINGS: Record<CharacterId, PlayerBindings> = {
  ali: { ...CHARACTERS.ali.bindings },
  jack: { ...CHARACTERS.jack.bindings },
}

const SETTINGS_KEY = 'merbut-settings'
const SETTINGS_VERSION = 1
/** Saves only a player who has run Merbut before has, even one who never opened Settings. */
const EARLIER_PLAY_KEYS = ['merbut-progress', 'merbut-graphics-notice-seen']

const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale)

/**
 * The language for a save that has none. Merbut was Turkish-only before the
 * English update, so a player who has already played keeps Turkish; only a
 * real first visit follows the browser.
 */
function startingLocale(hasSavedSettings: boolean): Locale {
  if (hasSavedSettings) return 'tr'
  try {
    const storage = safeStorage()
    if (EARLIER_PLAY_KEYS.some((key) => storage.getItem(key) !== null)) return 'tr'
  } catch {
    // Storage may be blocked; fall back to the browser language.
  }
  return detectLocale()
}

interface SettingsState {
  bindings: Record<CharacterId, PlayerBindings>
  /** Which connected gamepad (by index) controls each hero. */
  gamepadSlots: Record<CharacterId, number>
  screenShake: number
  reduceFlashes: boolean
  /** Attack warnings glow yellow-white with a larger ring instead of red. */
  colorSafeTelegraphs: boolean
  damageNumbers: boolean
  tutorialHints: boolean
  dialogueSpeed: DialogueSpeed
  textScale: TextScale
  showPrologue: boolean
  /** Interface and story language; first visit follows the browser. */
  language: Locale
  setBinding: (player: CharacterId, action: PlayerAction, code: string) => void
  resetBindings: () => void
  swapGamepads: () => void
  update: (patch: Partial<Omit<SettingsState, 'bindings' | 'gamepadSlots' | 'setBinding' | 'resetBindings' | 'swapGamepads' | 'update'>>) => void
}

export const useSettingsStore = create<SettingsState>()(persist((set) => ({
  bindings: { ali: { ...DEFAULT_BINDINGS.ali }, jack: { ...DEFAULT_BINDINGS.jack } },
  gamepadSlots: { ali: 0, jack: 1 },
  screenShake: 1,
  reduceFlashes: false,
  colorSafeTelegraphs: false,
  damageNumbers: true,
  tutorialHints: true,
  dialogueSpeed: 'normal',
  textScale: 1,
  showPrologue: true,
  language: detectLocale(),
  // A key can only belong to one action; a new binding steals it from the old owner.
  setBinding: (player, action, code) => set((state) => {
    const next = { ali: { ...state.bindings.ali }, jack: { ...state.bindings.jack } }
    for (const owner of ['ali', 'jack'] as const) {
      for (const [otherAction, otherCode] of Object.entries(next[owner]) as [PlayerAction, string][]) {
        if (otherCode === code) next[owner][otherAction] = ''
      }
    }
    next[player][action] = code
    return { bindings: next }
  }),
  resetBindings: () => set({ bindings: { ali: { ...DEFAULT_BINDINGS.ali }, jack: { ...DEFAULT_BINDINGS.jack } } }),
  swapGamepads: () => set((state) => ({ gamepadSlots: { ali: state.gamepadSlots.jack, jack: state.gamepadSlots.ali } })),
  update: (patch) => set(patch),
}), {
  name: SETTINGS_KEY,
  version: SETTINGS_VERSION,
  storage: createJSONStorage(safeStorage),
  partialize: ({ bindings, gamepadSlots, screenShake, reduceFlashes, colorSafeTelegraphs, damageNumbers, tutorialHints, dialogueSpeed, textScale, showPrologue, language }) => ({
    bindings, gamepadSlots, screenShake, reduceFlashes, colorSafeTelegraphs, damageNumbers, tutorialHints, dialogueSpeed, textScale, showPrologue, language,
  }),
  merge: (persisted, current) => {
    const saved = (persisted ?? {}) as Partial<SettingsState>
    return {
      ...current,
      ...saved,
      // An unknown value (hand-edited, or from a build with more languages) is decided again.
      language: isLocale(saved.language) ? saved.language : startingLocale(Boolean(persisted)),
      bindings: {
        ali: { ...DEFAULT_BINDINGS.ali, ...saved.bindings?.ali },
        jack: { ...DEFAULT_BINDINGS.jack, ...saved.bindings?.jack },
      },
    }
  },
}))

/**
 * A first visit saves its language straight away, and only that, so later
 * changes to the other defaults still reach this player. Without it the next
 * visit would find the progress save and take a new player for a returning one.
 */
function rememberStartingLanguage() {
  try {
    const storage = safeStorage()
    if (storage.getItem(SETTINGS_KEY) !== null) return
    storage.setItem(SETTINGS_KEY, JSON.stringify({ state: { language: useSettingsStore.getState().language }, version: SETTINGS_VERSION }))
  } catch {
    // Storage may be blocked; the next visit then simply decides again.
  }
}
rememberStartingLanguage()

/** Reduced motion is respected by default; the settings slider can raise it again. */
export function effectiveScreenShake() {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const value = useSettingsStore.getState().screenShake
  return reduced ? Math.min(value, 0.35) : value
}
