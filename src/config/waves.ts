import { BIOMES, BIOME_WORLD_WIDTH, WORLD_VISUAL_LEFT, WORLD_VISUAL_RIGHT } from './biomes'
import { BIOME_CONTENT } from '../content/biomeContent'
import type { EnemyKind, EnemyVariant } from './enemies'

export interface WaveSpawn {
  kind: EnemyKind
  side: -1 | 1
  variant?: EnemyVariant
  boss?: 'swamp' | 'final'
}

export interface WaveDefinition {
  id: string
  biome: number
  triggerX: number
  spawns: WaveSpawn[]
}

const WAVE_SPAWN_PADDING = 2

export function getWaveSpawnX(
  midpoint: number,
  side: -1 | 1,
  index: number,
  lockedLeft: number,
  lockedRight: number,
) {
  const offset = 6.4 + index * 1.15
  const left = Math.max(WORLD_VISUAL_LEFT + WAVE_SPAWN_PADDING, lockedLeft + WAVE_SPAWN_PADDING)
  const right = Math.min(WORLD_VISUAL_RIGHT - WAVE_SPAWN_PADDING, lockedRight - WAVE_SPAWN_PADDING)
  return Math.min(right, Math.max(left, midpoint + side * offset))
}

export function expandWaveSpawns(wave: WaveDefinition, extraEnemies: number): WaveSpawn[] {
  // Extra difficulty enemies copy the wave's regular creatures, never a boss or giant.
  const regular = wave.spawns.filter((spawn) => !spawn.boss && spawn.variant !== 'giant' && spawn.variant !== 'queen')
  return [
    ...wave.spawns,
    ...Array.from({ length: extraEnemies }, (_, index) => ({
      variant: 'normal' as const,
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

/** Wave ids read as a realm's story: entry, an optional middle beat, then the depth wave. */
function waveName(index: number, count: number) {
  if (index === 0) return 'entry'
  return index === count - 1 ? 'depth' : 'mid'
}

export const WAVES: readonly WaveDefinition[] = BIOMES.flatMap((biome, biomeIndex) => {
  const start = WORLD_VISUAL_LEFT + biomeIndex * BIOME_WORLD_WIDTH
  const waves = BIOME_CONTENT[biomeIndex]!.waves
  return waves.map((wave, index) => ({
    id: `${biome.id}-${waveName(index, waves.length)}`,
    biome: biomeIndex,
    triggerX: start + wave.trigger,
    spawns: [...wave.spawns],
  }))
})
