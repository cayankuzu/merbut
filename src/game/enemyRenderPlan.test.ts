import { describe, expect, it } from 'vitest'
import { buildEnemyRenderPlan, FULL_ENEMY_ACTOR_LIMITS } from './enemyRenderPlan'
import type { EnemyState } from '../types/session'

function enemy(id: string, x: number, overrides: Partial<EnemyState> = {}): EnemyState {
  return {
    id,
    biome: 0,
    kind: 1,
    title: id,
    x,
    health: 1,
    maxHealth: 1,
    damage: 1,
    speed: 1,
    attackRange: 1,
    attackCooldown: 1,
    score: 1,
    scale: 1,
    accent: '#ffffff',
    direction: 1,
    animation: 'walk',
    attackUntil: 0,
    nextAttackAt: 0,
    deadAt: 0,
    lastHitBy: null,
    boss: false,
    finalBoss: false,
    bossType: null,
    bossForm: 'normal',
    mimicKind: null,
    special: 'none',
    specialStartedAt: 0,
    specialUntil: 0,
    nextSpecialAt: 0,
    specialHitMask: 0,
    nextAuraAt: 0,
    ...overrides,
  }
}

describe('buildEnemyRenderPlan', () => {
  it('keeps nearby enemies nearest-first at full fidelity and batches the rest', () => {
    const enemies = Array.from({ length: 18 }, (_, index) => enemy(`enemy-${index}`, index - 9))
    const plan = buildEnemyRenderPlan(enemies, 0, 30, 'balanced')

    expect(plan.fullActorIds).toHaveLength(FULL_ENEMY_ACTOR_LIMITS.balanced)
    expect(plan.fullActorIds).toContain('enemy-9')
    expect(plan.proxyIds).toHaveLength(18 - FULL_ENEMY_ACTOR_LIMITS.balanced)
  })

  it('never demotes a boss and does not draw a proxy for dead normal enemies', () => {
    const boss = enemy('boss', 200, { boss: true, bossType: 'aku', finalBoss: true })
    const dead = enemy('dead', 0, { animation: 'dead' })
    const plan = buildEnemyRenderPlan([boss, dead, enemy('live', 1)], 0, 10, 'minimal')

    expect(plan.fullActorIds).toContain('boss')
    expect(plan.proxyIds).not.toContain('boss')
    expect(plan.proxyIds).not.toContain('dead')
  })

  it('keeps a nearby death animation in the bounded full-model budget', () => {
    const dying = enemy('dying', 0.2, { animation: 'dead' })
    const livingCrowd = Array.from({ length: 8 }, (_, index) => enemy(`live-${index}`, index + 1))
    const plan = buildEnemyRenderPlan([dying, ...livingCrowd], 0, 10, 'minimal')

    expect(plan.fullActorIds).toContain('dying')
    expect(plan.fullActorIds).toHaveLength(FULL_ENEMY_ACTOR_LIMITS.minimal)
    expect(plan.proxyIds).not.toContain('dying')
  })
})
