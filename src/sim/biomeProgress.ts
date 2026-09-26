import { BIOMES, BIOME_WORLD_WIDTH, WORLD_VISUAL_LEFT, WORLD_VISUAL_RIGHT } from '../config/biomes'
import { WAVES, type WaveDefinition } from '../config/waves'
import type { EnemyState } from '../types/session'

export const BIOME_GATE_PADDING = 1.25

export function getBiomeGateX(biome: number) {
  return WORLD_VISUAL_LEFT + (biome + 1) * BIOME_WORLD_WIDTH
}

export function areBiomeEnemiesCleared(
  biome: number,
  spawnedWaves: readonly string[],
  enemies: readonly EnemyState[],
) {
  const allWavesSpawned = WAVES
    .filter((wave) => wave.biome === biome)
    .every((wave) => spawnedWaves.includes(wave.id))
  const hasLivingEnemy = enemies.some(
    (enemy) => enemy.biome === biome && enemy.animation !== 'dead',
  )
  return allWavesSpawned && !hasLivingEnemy
}

export function arePriorBiomeWavesCleared(
  wave: WaveDefinition,
  spawnedWaves: readonly string[],
  enemies: readonly EnemyState[],
) {
  const waveIndex = WAVES.indexOf(wave)
  const priorWaves = WAVES.slice(0, waveIndex).filter((candidate) => candidate.biome === wave.biome)
  if (priorWaves.length === 0) return true
  return priorWaves.every((candidate) => spawnedWaves.includes(candidate.id))
    && !enemies.some((enemy) => enemy.biome === wave.biome && enemy.animation !== 'dead')
}

export function getClosedBiomeRightLimit(biome: number) {
  if (biome >= BIOMES.length - 1) return WORLD_VISUAL_RIGHT
  return getBiomeGateX(biome) - BIOME_GATE_PADDING
}

export function getClosedBiomeLeftLimit(biome: number) {
  if (biome <= 0) return -4.8
  return getBiomeGateX(biome - 1) + BIOME_GATE_PADDING
}
