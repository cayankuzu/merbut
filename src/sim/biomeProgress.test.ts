import { describe, expect, it } from 'vitest'
import { WAVES } from '../config/waves'
import type { EnemyState } from '../types/session'
import { areBiomeEnemiesCleared, arePriorBiomeWavesCleared, getBiomeGateX, getClosedBiomeLeftLimit } from './biomeProgress'

describe('biome progression gates', () => {
  it('opens only after every wave spawned and every enemy died', () => {
    const waveIds = WAVES.filter((wave) => wave.biome === 0).map((wave) => wave.id)
    expect(areBiomeEnemiesCleared(0, [], [])).toBe(false)
    expect(areBiomeEnemiesCleared(0, waveIds, [])).toBe(true)
    const living = { biome: 0, animation: 'walk' } as EnemyState
    expect(areBiomeEnemiesCleared(0, waveIds, [living])).toBe(false)
    expect(areBiomeEnemiesCleared(0, waveIds, [{ ...living, animation: 'dead' }])).toBe(true)
  })

  it('places the first wall at the first biome boundary', () => {
    expect(getBiomeGateX(0)).toBe(27)
    expect(getClosedBiomeLeftLimit(0)).toBe(-4.8)
    expect(getClosedBiomeLeftLimit(1)).toBe(28.25)
  })

  it('does not activate a depth or boss wave while an earlier area enemy lives', () => {
    const [entry, depth] = WAVES.filter((wave) => wave.biome === 2)
    const living = { biome: 2, animation: 'walk' } as EnemyState
    expect(arePriorBiomeWavesCleared(entry!, [], [])).toBe(true)
    expect(arePriorBiomeWavesCleared(depth!, [entry!.id], [living])).toBe(false)
    expect(arePriorBiomeWavesCleared(depth!, [entry!.id], [{ ...living, animation: 'dead' }])).toBe(true)
  })
})
