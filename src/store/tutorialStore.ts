import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CharacterId } from '../types/character'
import { safeStorage } from '../utils/safeStorage'

/** Actions a new player is taught, in the order the hints appear. */
export const TUTORIAL_STEPS = ['move', 'jump', 'attack', 'dash', 'ability'] as const
export type TutorialStep = typeof TUTORIAL_STEPS[number]

interface TutorialState {
  learned: Record<CharacterId, TutorialStep[]>
  markLearned: (player: CharacterId, step: TutorialStep) => void
  reset: () => void
}

export const useTutorialStore = create<TutorialState>()(persist((set) => ({
  learned: { ali: [], jack: [] },
  markLearned: (player, step) => set((state) => state.learned[player].includes(step)
    ? state
    : { learned: { ...state.learned, [player]: [...state.learned[player], step] } }),
  reset: () => set({ learned: { ali: [], jack: [] } }),
}), { name: 'merbut-tutorial', version: 1, storage: createJSONStorage(safeStorage) }))

export function nextTutorialStep(player: CharacterId, abilityReady: boolean): TutorialStep | null {
  const learned = useTutorialStore.getState().learned[player]
  return TUTORIAL_STEPS.find((step) => !learned.includes(step) && (step !== 'ability' || abilityReady)) ?? null
}
