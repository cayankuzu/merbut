import { create } from 'zustand'

/** Which overlay screen the out-of-combat menus show. */
export type MenuView = 'title' | 'main' | 'chapters' | 'achievements' | 'characters' | 'credits' | 'patch-notes'

interface UiState {
  view: MenuView
  /** Biome a "chapter select" or "continue" run will start in; 0 is a new game. */
  pendingBiome: number
  setView: (view: MenuView) => void
  setPendingBiome: (biome: number) => void
}

export const useUiStore = create<UiState>((set) => ({
  view: 'title',
  pendingBiome: 0,
  setView: (view) => set({ view }),
  setPendingBiome: (pendingBiome) => set({ pendingBiome }),
}))
