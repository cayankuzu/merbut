import { describe, expect, it } from 'vitest'
import { BIOME_WORLD_WIDTH, WORLD_VISUAL_LEFT } from '../config/biomes'
import type { Difficulty } from '../config/difficulty'
import { buildAkuPortalAmbush, getAkuPortalAmbushCount } from './akuPortalAmbush'

describe('Aku time-portal ambush', () => {
  it('increases the enemy count with every difficulty tier', () => {
    const difficulties: Difficulty[] = ['easy', 'normal', 'hard', 'soulslike']
    expect(difficulties.map(getAkuPortalAmbushCount)).toEqual([2, 3, 5, 6])
  })

  it('builds a varied regular-enemy ambush around the destination', () => {
    const destinationBiome = 3
    const destinationX = WORLD_VISUAL_LEFT + destinationBiome * BIOME_WORLD_WIDTH + BIOME_WORLD_WIDTH / 2
    let sequence = 0
    const ambush = buildAkuPortalAmbush({
      destinationBiome,
      destinationX,
      difficulty: 'hard',
      now: 10_000,
      nextId: () => `portal-test-${++sequence}`,
      random: () => 0.37,
    })

    expect(ambush).toHaveLength(5)
    expect(new Set(ambush.map((enemy) => enemy.kind)).size).toBe(5)
    expect(ambush.every((enemy) => !enemy.boss && enemy.biome === destinationBiome)).toBe(true)
    expect(ambush.every((enemy) => Math.abs(enemy.x - destinationX) >= 4)).toBe(true)
    expect(ambush.every((enemy) => enemy.x > WORLD_VISUAL_LEFT + destinationBiome * BIOME_WORLD_WIDTH)).toBe(true)
    expect(ambush.every((enemy) => enemy.x < WORLD_VISUAL_LEFT + (destinationBiome + 1) * BIOME_WORLD_WIDTH)).toBe(true)
  })
})
