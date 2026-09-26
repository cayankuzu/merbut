import { beforeEach, describe, expect, it } from 'vitest'
import { computeRank, useProgressStore } from './progressStore'

describe('progress and ranks', () => {
  beforeEach(() => useProgressStore.getState().resetAll())

  it('ranks fast, clean runs higher and rewards harder difficulties', () => {
    expect(computeRank('normal', 10 * 60, 0, 40).rank).toBe('S')
    expect(computeRank('normal', 30 * 60, 6, 5).rank).toBe('D')
    expect(computeRank('soulslike', 20 * 60, 2, 10).points).toBeGreaterThan(computeRank('easy', 20 * 60, 2, 10).points)
  })

  it('keeps the best time and best rank per difficulty and clears the checkpoint', () => {
    const store = useProgressStore.getState()
    store.reachBiome(4, 'hard')
    expect(useProgressStore.getState().checkpoint).toEqual({ biome: 4, difficulty: 'hard' })
    store.recordVictory('hard', 900, 'A')
    store.recordVictory('hard', 1_200, 'B')
    expect(useProgressStore.getState()).toMatchObject({ checkpoint: null, furthestBiome: 9, bestTimes: { hard: 900 }, bestRanks: { hard: 'A' } })
  })

  it('unlocks an achievement exactly once', () => {
    expect(useProgressStore.getState().unlock('first-blood')).toBe(true)
    expect(useProgressStore.getState().unlock('first-blood')).toBe(false)
  })
})
