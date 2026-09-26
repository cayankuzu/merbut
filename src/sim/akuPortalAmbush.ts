import { BIOME_WORLD_WIDTH, WORLD_VISUAL_LEFT } from '../config/biomes'
import { DIFFICULTIES, type Difficulty } from '../config/difficulty'
import type { EnemyKind } from '../config/enemies'
import type { EnemyState } from '../types/session'
import { createEnemy, laneForIndex } from './enemyFactory'

const PORTAL_AMBUSH_BASE_COUNT = 2
const PORTAL_AMBUSH_EDGE_PADDING = 1.8

interface AkuPortalAmbushOptions {
  destinationBiome: number
  destinationX: number
  difficulty: Difficulty
  now: number
  nextId: () => string
  random?: () => number
}

function randomUnit(random: () => number) {
  return Math.max(0, Math.min(0.999_999, random()))
}

function randomBetween(minimum: number, maximum: number, random: () => number) {
  return minimum + randomUnit(random) * (maximum - minimum)
}

function shuffledEnemyKinds(random: () => number) {
  const kinds: EnemyKind[] = [1, 2, 3, 4, 5]
  for (let index = kinds.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomUnit(random) * (index + 1))
    ;[kinds[index], kinds[swapIndex]] = [kinds[swapIndex]!, kinds[index]!]
  }
  return kinds
}

export function getAkuPortalAmbushCount(difficulty: Difficulty) {
  return PORTAL_AMBUSH_BASE_COUNT + DIFFICULTIES[difficulty].extraEnemies
}

export function buildAkuPortalAmbush({
  destinationBiome,
  destinationX,
  difficulty,
  now,
  nextId,
  random = Math.random,
}: AkuPortalAmbushOptions): EnemyState[] {
  const count = getAkuPortalAmbushCount(difficulty)
  const kinds = shuffledEnemyKinds(random)
  const biomeLeft = WORLD_VISUAL_LEFT + destinationBiome * BIOME_WORLD_WIDTH
  const biomeRight = biomeLeft + BIOME_WORLD_WIDTH

  return Array.from({ length: count }, (_, index) => {
    const kind = kinds[index % kinds.length]!
    const side = index % 2 === 0 ? -1 : 1
    const rank = Math.floor(index / 2)
    const distance = 4.4 + rank * 1.65 + randomBetween(-0.35, 0.55, random)
    const x = Math.max(
      biomeLeft + PORTAL_AMBUSH_EDGE_PADDING,
      Math.min(biomeRight - PORTAL_AMBUSH_EDGE_PADDING, destinationX + side * distance),
    )
    return {
      ...createEnemy({ id: nextId(), biome: destinationBiome, kind, x, now, lane: laneForIndex(index) }),
      direction: side === -1 ? 1 as const : -1 as const,
      nextAttackAt: now + randomBetween(650, 1_250, random),
    }
  })
}
