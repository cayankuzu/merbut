import { useSessionStore } from '../store/sessionStore'
import type { EnemyProjectileState, MeteorState, ProjectileState } from '../types/session'

/**
 * Projectile arrays are replaced atomically by the combat simulation.  Cache a
 * lookup for each immutable array reference so every visible projectile does
 * not scan the full list on every rendered frame.
 */
function indexById<T extends { id: string }>(
  cache: WeakMap<readonly T[], ReadonlyMap<string, T>>,
  values: readonly T[],
) {
  let index = cache.get(values)
  if (!index) {
    index = new Map(values.map((value) => [value.id, value]))
    cache.set(values, index)
  }
  return index
}

const fireballIndexes = new WeakMap<readonly ProjectileState[], ReadonlyMap<string, ProjectileState>>()
const enemyProjectileIndexes = new WeakMap<readonly EnemyProjectileState[], ReadonlyMap<string, EnemyProjectileState>>()
const meteorIndexes = new WeakMap<readonly MeteorState[], ReadonlyMap<string, MeteorState>>()

export function fireballById(projectiles: readonly ProjectileState[], id: string) {
  return indexById(fireballIndexes, projectiles).get(id)
}

export function enemyProjectileById(projectiles: readonly EnemyProjectileState[], id: string) {
  return indexById(enemyProjectileIndexes, projectiles).get(id)
}

export function currentFireballById(id: string) {
  return fireballById(useSessionStore.getState().projectiles, id)
}

export function currentEnemyProjectileById(id: string) {
  return enemyProjectileById(useSessionStore.getState().enemyProjectiles, id)
}

export function currentMeteorById(id: string) {
  return indexById(meteorIndexes, useSessionStore.getState().meteors).get(id)
}
