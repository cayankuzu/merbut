import type { EnemyState } from '../types/session'
import { useSessionStore } from '../store/sessionStore'

let source: EnemyState[] | null = null
let lookup = new Map<string, EnemyState>()

export function enemyById(enemies: EnemyState[], id: string) {
  if (source !== enemies) {
    source = enemies
    lookup = new Map(enemies.map((enemy) => [enemy.id, enemy]))
  }
  return lookup.get(id)
}

export function currentEnemyById(id: string) {
  return enemyById(useSessionStore.getState().enemies, id)
}
