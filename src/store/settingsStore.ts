import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { CHARACTERS } from '../config/gameConfig'
import type { CharacterId } from '../types/character'
import type { PlayerAction, PlayerBindings } from '../types/controls'
import { safeStorage } from '../utils/safeStorage'

export type DialogueSpeed = 'slow' | 'normal' | 'fast' | 'instant'
export type TextScale = 1 | 1.15 | 1.3

export const DEFAULT_BINDINGS: Record<CharacterId, PlayerBindings> = {
  ali: { ...CHARACTERS.ali.bindings },
  jack: { ...CHARACTERS.jack.bindings },
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
  name: 'merbut-settings',
  version: 1,
  storage: createJSONStorage(safeStorage),
  partialize: ({ bindings, gamepadSlots, screenShake, reduceFlashes, colorSafeTelegraphs, damageNumbers, tutorialHints, dialogueSpeed, textScale, showPrologue }) => ({
    bindings, gamepadSlots, screenShake, reduceFlashes, colorSafeTelegraphs, damageNumbers, tutorialHints, dialogueSpeed, textScale, showPrologue,
  }),
  merge: (persisted, current) => {
    const saved = (persisted ?? {}) as Partial<SettingsState>
    return {
      ...current,
      ...saved,
      bindings: {
        ali: { ...DEFAULT_BINDINGS.ali, ...saved.bindings?.ali },
        jack: { ...DEFAULT_BINDINGS.jack, ...saved.bindings?.jack },
      },
    }
  },
}))

/** Reduced motion is respected by default; the settings slider can raise it again. */
export function effectiveScreenShake() {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const value = useSettingsStore.getState().screenShake
  return reduced ? Math.min(value, 0.35) : value
}
