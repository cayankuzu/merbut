import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { BIOMES } from '../config/biomes'
import { DIFFICULTIES, type Difficulty } from '../config/difficulty'
import { safeStorage } from '../utils/safeStorage'

export type Rank = 'S' | 'A' | 'B' | 'C' | 'D'
const RANK_ORDER: Record<Rank, number> = { S: 4, A: 3, B: 2, C: 1, D: 0 }

export interface LifetimeStats {
  runs: number
  victories: number
  kills: number
  falls: number
  perfectDodges: number
  bestCombo: number
  playSeconds: number
}

interface ProgressState {
  /** Highest biome index a run has entered; chapters up to it are unlocked. */
  furthestBiome: number
  checkpoint: { biome: number; difficulty: Difficulty } | null
  bestTimes: Partial<Record<Difficulty, number>>
  bestRanks: Partial<Record<Difficulty, Rank>>
  achievements: Record<string, number>
  stats: LifetimeStats
  prologueSeen: boolean
  reachBiome: (biome: number, difficulty: Difficulty) => void
  clearCheckpoint: () => void
  recordVictory: (difficulty: Difficulty, seconds: number, rank: Rank) => void
  unlock: (id: string) => boolean
  addStats: (patch: Partial<LifetimeStats>) => void
  markPrologueSeen: () => void
  resetAll: () => void
}

const EMPTY_STATS: LifetimeStats = { runs: 0, victories: 0, kills: 0, falls: 0, perfectDodges: 0, bestCombo: 0, playSeconds: 0 }

export const useProgressStore = create<ProgressState>()(persist((set, get) => ({
  furthestBiome: 0,
  checkpoint: null,
  bestTimes: {},
  bestRanks: {},
  achievements: {},
  stats: { ...EMPTY_STATS },
  prologueSeen: false,
  reachBiome: (biome, difficulty) => set((state) => ({
    furthestBiome: Math.max(state.furthestBiome, biome),
    checkpoint: { biome, difficulty },
  })),
  clearCheckpoint: () => set({ checkpoint: null }),
  recordVictory: (difficulty, seconds, rank) => set((state) => {
    const previousTime = state.bestTimes[difficulty]
    const previousRank = state.bestRanks[difficulty]
    return {
      checkpoint: null,
      furthestBiome: BIOMES.length - 1,
      bestTimes: { ...state.bestTimes, [difficulty]: previousTime === undefined ? seconds : Math.min(previousTime, seconds) },
      bestRanks: { ...state.bestRanks, [difficulty]: previousRank && RANK_ORDER[previousRank] >= RANK_ORDER[rank] ? previousRank : rank },
    }
  }),
  unlock: (id) => {
    if (get().achievements[id]) return false
    set((state) => ({ achievements: { ...state.achievements, [id]: Date.now() } }))
    return true
  },
  addStats: (patch) => set((state) => {
    const stats = { ...state.stats }
    for (const [key, value] of Object.entries(patch) as [keyof LifetimeStats, number][]) {
      stats[key] = key === 'bestCombo' ? Math.max(stats.bestCombo, value) : stats[key] + value
    }
    return { stats }
  }),
  markPrologueSeen: () => set({ prologueSeen: true }),
  resetAll: () => set({ furthestBiome: 0, checkpoint: null, bestTimes: {}, bestRanks: {}, achievements: {}, stats: { ...EMPTY_STATS }, prologueSeen: false }),
}), {
  name: 'merbut-progress',
  version: 2,
  // v2 inserted three realms (desert, foundry, storm peak): remap saved indices.
  migrate: (persisted, version) => {
    const state = persisted as { furthestBiome?: number; checkpoint?: { biome: number; difficulty: Difficulty } | null }
    if (version < 2) {
      const remap = (index: number) => [0, 1, 3, 5, 6, 8, 9][Math.max(0, Math.min(6, index))]!
      if (typeof state.furthestBiome === 'number') state.furthestBiome = remap(state.furthestBiome)
      if (state.checkpoint) state.checkpoint = { ...state.checkpoint, biome: remap(state.checkpoint.biome) }
    }
    return state as ProgressState
  },
  storage: createJSONStorage(safeStorage),
  partialize: ({ furthestBiome, checkpoint, bestTimes, bestRanks, achievements, stats, prologueSeen }) => ({ furthestBiome, checkpoint, bestTimes, bestRanks, achievements, stats, prologueSeen }),
}))

/**
 * Rank from a single readable formula: start at 1000, lose points for time and
 * falls, earn some back for combos; harder difficulties get a multiplier.
 */
export function computeRank(difficulty: Difficulty, seconds: number, falls: number, bestCombo: number): { rank: Rank; points: number } {
  const raw = 1_000 - (seconds / 60) * 12 - falls * 70 + Math.min(bestCombo, 60) * 3
  const points = Math.round(Math.max(0, raw) * DIFFICULTIES[difficulty].rankBonus)
  const rank: Rank = points >= 900 ? 'S' : points >= 740 ? 'A' : points >= 560 ? 'B' : points >= 380 ? 'C' : 'D'
  return { rank, points }
}
