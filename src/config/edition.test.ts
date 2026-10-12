import { describe, expect, it } from 'vitest'
import { DEMO_LAST_BIOME, demoEndsAfter, FULL_GAME_URL, isPlayableBiome } from './edition'

describe('web demo edition', () => {
  it('plays only the first two realms in the demo and every realm in the full game', () => {
    expect(DEMO_LAST_BIOME).toBe(1)
    expect([0, 1, 2, 9].map((biome) => isPlayableBiome(biome, true))).toEqual([true, true, false, false])
    expect([0, 1, 2, 9].map((biome) => isPlayableBiome(biome, false))).toEqual([true, true, true, true])
  })

  it('ends the demo only at the gate of its last realm', () => {
    expect(demoEndsAfter(0, true)).toBe(false)
    expect(demoEndsAfter(1, true)).toBe(true)
    expect(demoEndsAfter(1, false)).toBe(false)
  })

  it('unit tests build the full game and point buyers at the itch.io page', () => {
    expect(isPlayableBiome(9)).toBe(true)
    expect(FULL_GAME_URL).toBe('https://memode.itch.io/merbut')
  })
})
