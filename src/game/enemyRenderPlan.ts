import type { EnemyState } from '../types/session'
import type { PerformanceTier } from '../store/performanceStore'

/**
 * A skinned GLTF character is considerably more expensive than a static
 * instance. Keep a small, nearest-first set at full fidelity and let the
 * remainder be drawn by CrowdEnemyProxies. Bosses never enter this budget.
 */
export const FULL_ENEMY_ACTOR_LIMITS: Record<PerformanceTier, number> = {
  minimal: 3,
  performance: 5,
  balanced: 8,
  high: 12,
}

export interface EnemyRenderPlan {
  fullActorIds: string[]
  proxyIds: string[]
}

export function buildEnemyRenderPlan(
  enemies: readonly EnemyState[],
  cameraX: number,
  actorMountDistance: number,
  tier: PerformanceTier,
  preferredFullActorIds: readonly string[] = [],
  fullActorLimit = FULL_ENEMY_ACTOR_LIMITS[tier],
): EnemyRenderPlan {
  const fullActorIds: string[] = []
  const nearbyNormals: EnemyState[] = []
  const proxyIds: string[] = []
  const preferred = new Set(preferredFullActorIds)

  for (const enemy of enemies) {
    // Bosses retain their bespoke mesh, animation and abilities at every
    // distance. Dead normal enemies do not need a crowd representation.
    if (enemy.boss) {
      fullActorIds.push(enemy.id)
      continue
    }
    const nearby = Math.abs(enemy.x - cameraX) <= actorMountDistance
    // Do not replace a nearby death animation with an invisible proxy on the
    // next 180 ms render-plan refresh. Dead normals remain within the same
    // bounded full-model budget until the session removes them.
    if (enemy.animation === 'dead') {
      if (nearby) nearbyNormals.push(enemy)
      continue
    }

    proxyIds.push(enemy.id)
    if (nearby) nearbyNormals.push(enemy)
  }

  nearbyNormals
    .sort((left, right) => {
      const leftDying = left.animation === 'dead'
      const rightDying = right.animation === 'dead'
      if (leftDying !== rightDying) return leftDying ? -1 : 1
      const leftPreferred = preferred.has(left.id)
      const rightPreferred = preferred.has(right.id)
      if (leftPreferred !== rightPreferred) return leftPreferred ? -1 : 1
      return Math.abs(left.x - cameraX) - Math.abs(right.x - cameraX)
    })
    .slice(0, fullActorLimit)
    .forEach((enemy) => fullActorIds.push(enemy.id))

  const fullSet = new Set(fullActorIds)
  return {
    fullActorIds,
    proxyIds: proxyIds.filter((id) => !fullSet.has(id)),
  }
}
