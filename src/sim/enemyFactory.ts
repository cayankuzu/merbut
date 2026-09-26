import { ENEMIES, ENEMY_VARIANTS, enemyDisplayName, isHeavyVariant, type EnemyKind, type EnemyVariant } from '../config/enemies'
import type { EnemyState } from '../types/session'

let sequence = 0

export function nextEnemyId(prefix = 'enemy') {
  sequence += 1
  return `${prefix}-${sequence}`
}

/** Spreads a crowd over three shallow depth lanes so bodies never overlap. */
export function laneForIndex(index: number) {
  return [0.62, -0.62, 0][index % 3]!
}

interface EnemyOptions {
  id?: string
  biome: number
  kind: EnemyKind
  variant?: EnemyVariant
  x: number
  now: number
  lane?: number
}

/** The one place a regular creature is created; every field has a sane default. */
export function createEnemy({ id = nextEnemyId(), biome, kind, variant = 'normal', x, now, lane = 0 }: EnemyOptions): EnemyState {
  const base = ENEMIES[kind]
  const rules = ENEMY_VARIANTS[variant]
  const maxHealth = Math.round(base.health * rules.health)
  return {
    id,
    biome,
    kind,
    title: enemyDisplayName(kind, variant),
    x,
    health: maxHealth,
    maxHealth,
    damage: Math.round(base.damage * rules.damage),
    speed: base.speed * rules.speed,
    attackRange: isHeavyVariant(variant) ? Math.max(base.attackRange, 3.6) : base.attackRange,
    attackCooldown: base.attackCooldown,
    score: Math.round(base.score * rules.score),
    scale: base.scale * rules.scale,
    accent: rules.accent ?? base.accent,
    direction: -1,
    animation: 'walk',
    attackUntil: 0,
    nextAttackAt: now + 900,
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
    variant,
    z: lane,
    vx: 0,
    stunUntil: 0,
    windupUntil: 0,
    spawnedAt: now,
  }
}
