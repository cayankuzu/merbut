import { describe, expect, it } from 'vitest'
import { BIOMES, BIOME_WORLD_WIDTH, WORLD_VISUAL_LEFT } from './biomes'
import { expandWaveSpawns, shouldTriggerWave, WAVES } from './waves'
import { DIFFICULTIES } from './difficulty'

describe('boss wave placement', () => {
  it('places both bosses in the second panel of their requested biome', () => {
    const swampBossWave = WAVES.find((wave) => wave.spawns.some((spawn) => spawn.boss === 'swamp'))!
    const finalBossWave = WAVES.find((wave) => wave.spawns.some((spawn) => spawn.boss === 'final'))!
    const swampStart = WORLD_VISUAL_LEFT + 2 * BIOME_WORLD_WIDTH
    const finalStart = WORLD_VISUAL_LEFT + (BIOMES.length - 1) * BIOME_WORLD_WIDTH
    expect(swampBossWave.triggerX).toBeGreaterThan(swampStart + BIOME_WORLD_WIDTH / 2)
    expect(finalBossWave.triggerX).toBeGreaterThan(finalStart + BIOME_WORLD_WIDTH / 2)
    expect(finalBossWave.biome).toBe(BIOMES.length - 1)
  })
})

describe('difficulty wave scaling', () => {
  it('raises regular enemy count without duplicating boss strength rules', () => {
    const regularWave = WAVES.find((wave) => wave.spawns.every((spawn) => !spawn.boss))!
    const baseCount = regularWave.spawns.length
    expect(expandWaveSpawns(regularWave, DIFFICULTIES.easy.extraEnemies)).toHaveLength(baseCount)
    expect(expandWaveSpawns(regularWave, DIFFICULTIES.normal.extraEnemies)).toHaveLength(baseCount + 1)
    expect(expandWaveSpawns(regularWave, DIFFICULTIES.hard.extraEnemies)).toHaveLength(baseCount + 3)
    expect(DIFFICULTIES.soulslike.extraEnemies).toBe(DIFFICULTIES.hard.extraEnemies + 1)
    expect(expandWaveSpawns(regularWave, DIFFICULTIES.soulslike.extraEnemies)).toHaveLength(baseCount + 4)
  })

  it('makes every harder boss tier stronger and faster', () => {
    expect(DIFFICULTIES.normal.bossHealth).toBeGreaterThan(DIFFICULTIES.easy.bossHealth)
    expect(DIFFICULTIES.hard.bossDamage).toBeGreaterThan(DIFFICULTIES.normal.bossDamage)
    expect(DIFFICULTIES.soulslike.bossSpeed).toBeGreaterThan(DIFFICULTIES.hard.bossSpeed)
    expect(DIFFICULTIES.soulslike.bossCooldown).toBeLessThan(DIFFICULTIES.hard.bossCooldown)
  })
})

describe('wave biome gate', () => {
  it('never opens a wave that belongs to a future or previous biome', () => {
    const wave = WAVES.find((candidate) => candidate.biome === 3)!
    expect(shouldTriggerWave(wave, 2, [], 10, wave.triggerX)).toBe(false)
    expect(shouldTriggerWave(wave, 4, [], 10, wave.triggerX)).toBe(false)
    expect(shouldTriggerWave(wave, 3, [], 10, wave.triggerX)).toBe(true)
    expect(shouldTriggerWave(wave, 3, [wave.id], 10, wave.triggerX)).toBe(false)
  })
})
