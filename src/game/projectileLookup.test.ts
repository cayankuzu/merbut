import { describe, expect, it } from 'vitest'
import type { EnemyProjectileState, ProjectileState } from '../types/session'
import { enemyProjectileById, fireballById } from './projectileLookup'

describe('projectile lookup cache', () => {
  it('finds a fireball by id from an immutable simulation snapshot', () => {
    const first = { id: 'fireball-1', owner: 'ali', x: 1, y: 2, z: 3, directionX: 1, directionZ: 0, travelled: 0 } satisfies ProjectileState
    const second = { ...first, id: 'fireball-2', x: 4 }
    const snapshot = [first, second]

    expect(fireballById(snapshot, 'fireball-2')).toBe(second)
    expect(fireballById(snapshot, 'missing')).toBeUndefined()
  })

  it('keeps indexes isolated when the simulation publishes a new array', () => {
    const before = [{ id: 'orb-1', kind: 'dark-orb', sourceId: 'enemy-1', x: 2, y: 1, targetX: 8, damage: 10, travelled: 0 }] satisfies EnemyProjectileState[]
    const after = [{ ...before[0], id: 'orb-2', x: 6 }]

    expect(enemyProjectileById(before, 'orb-1')).toBe(before[0])
    expect(enemyProjectileById(after, 'orb-1')).toBeUndefined()
    expect(enemyProjectileById(after, 'orb-2')).toBe(after[0])
  })
})
