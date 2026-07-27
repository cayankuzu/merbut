import { BIOMES, BIOME_WORLD_WIDTH, WORLD_VISUAL_LEFT } from './biomes'
import type { EnemyKind } from './enemies'

export interface WaveSpawn {
  kind: EnemyKind
  side: -1 | 1
  boss?: 'swamp' | 'final'
}

export interface WaveDefinition {
  id: string
  biome: number
  triggerX: number
  spawns: WaveSpawn[]
}

export function expandWaveSpawns(wave: WaveDefinition, extraEnemies: number): WaveSpawn[] {
  const regular = wave.spawns.filter((spawn) => !spawn.boss)
  return [
    ...wave.spawns,
    ...Array.from({ length: extraEnemies }, (_, index) => ({
      ...(regular[index % Math.max(1, regular.length)] ?? {
        kind: ((wave.biome + index) % 5 + 1) as EnemyKind,
        side: index % 2 ? -1 as const : 1 as const,
      }),
      side: index % 2 ? -1 as const : 1 as const,
    })),
  ]
}

export function shouldTriggerWave(
  wave: WaveDefinition,
  currentBiome: number,
  spawnedWaves: readonly string[],
  elapsedSeconds: number,
  midpoint: number,
) {
  return wave.biome === currentBiome
    && elapsedSeconds >= 1.25
    && !spawnedWaves.includes(wave.id)
    && midpoint + 7.5 >= wave.triggerX
}

export const WAVES: readonly WaveDefinition[] = BIOMES.flatMap((biome, biomeIndex) => {
  const start = WORLD_VISUAL_LEFT + biomeIndex * BIOME_WORLD_WIDTH
  const firstKind = (biomeIndex % 5 + 1) as EnemyKind
  const secondKind = ((biomeIndex + 1) % 5 + 1) as EnemyKind
  const entry: WaveDefinition = {
    id: `${biome.id}-entry`,
    biome: biomeIndex,
    triggerX: start + 6,
    spawns: [
      { kind: firstKind, side: 1 },
      { kind: secondKind, side: -1 },
    ],
  }
  const depthSpawns: WaveSpawn[] = [
    { kind: secondKind, side: 1 },
    { kind: firstKind, side: -1 },
    { kind: ((biomeIndex + 2) % 5 + 1) as EnemyKind, side: 1 },
  ]
  if (biomeIndex === 2) depthSpawns.splice(0, depthSpawns.length, { kind: 4, side: 1, boss: 'swamp' })
  if (biomeIndex === BIOMES.length - 1) depthSpawns.splice(0, depthSpawns.length, { kind: 5, side: 1, boss: 'final' })
  return [
    entry,
    { id: `${biome.id}-depth`, biome: biomeIndex, triggerX: start + 23, spawns: depthSpawns },
  ]
})
