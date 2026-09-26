import { ASSET_PATHS } from './assetPaths'

export type EnemyKind = 1 | 2 | 3 | 4 | 5
export type EnemyAbility = 'spin' | 'dash' | 'quake' | 'stone' | 'dark-orb'

export interface EnemyDefinition {
  kind: EnemyKind
  title: string
  walk: string
  attack: string
  health: number
  damage: number
  speed: number
  attackRange: number
  attackCooldown: number
  score: number
  scale: number
  accent: string
  ability: EnemyAbility
}

const enemyAsset = (kind: EnemyKind) => ASSET_PATHS.enemies[kind - 1]!

export const ENEMIES: Record<EnemyKind, EnemyDefinition> = {
  1: { kind: 1, title: 'Myrkhan', ...enemyAsset(1), health: 70, damage: 13, speed: 1.65, attackRange: 1.55, attackCooldown: 1.55, score: 120, scale: 1.98, accent: '#ff6a42', ability: 'spin' },
  2: { kind: 2, title: 'Zorvex', ...enemyAsset(2), health: 90, damage: 16, speed: 1.3, attackRange: 1.75, attackCooldown: 1.8, score: 160, scale: 2.07, accent: '#c655ff', ability: 'dash' },
  3: { kind: 3, title: 'Kharzul', ...enemyAsset(3), health: 120, damage: 20, speed: 1.05, attackRange: 3.15, attackCooldown: 2.1, score: 210, scale: 2.35, accent: '#dcdf4c', ability: 'quake' },
  4: { kind: 4, title: 'Vhalgor', ...enemyAsset(4), health: 155, damage: 24, speed: 1.18, attackRange: 6.4, attackCooldown: 2.25, score: 280, scale: 2.27, accent: '#53e89c', ability: 'stone' },
  5: { kind: 5, title: 'Nexrath', ...enemyAsset(5), health: 190, damage: 28, speed: 1.28, attackRange: 7.2, attackCooldown: 2.05, score: 360, scale: 2.38, accent: '#58cbff', ability: 'dark-orb' },
}

/**
 * A variant keeps the creature's model and moveset but changes how it reads and
 * how tough it is. Each variant has one name prefix so players learn them.
 */
export type EnemyVariant = 'normal' | 'elite' | 'ghost' | 'giant' | 'mirage' | 'drone' | 'queen'

export interface EnemyVariantDefinition {
  prefix: string
  health: number
  damage: number
  speed: number
  scale: number
  score: number
  /** Milliseconds the attack is telegraphed before it lands. */
  windupMs: number
  accent?: string
}

export const ENEMY_VARIANTS: Record<EnemyVariant, EnemyVariantDefinition> = {
  normal: { prefix: '', health: 1, damage: 1, speed: 1, scale: 1, score: 1, windupMs: 460 },
  elite: { prefix: 'Seçkin', health: 1.65, damage: 1.2, speed: 1.08, scale: 1.14, score: 1.8, windupMs: 400, accent: '#ffd36b' },
  ghost: { prefix: 'Hayalet', health: 1.1, damage: 1, speed: 1.05, scale: 1, score: 1.4, windupMs: 520, accent: '#7dffc4' },
  giant: { prefix: 'Kemik Devi', health: 4.6, damage: 1.55, speed: 0.72, scale: 1.62, score: 6, windupMs: 780, accent: '#e9f4ff' },
  // Heat-haze copies of the desert: one clean cut makes them sand again.
  mirage: { prefix: 'Serap', health: 0.2, damage: 0.7, speed: 1.12, scale: 1, score: 0.5, windupMs: 580, accent: '#ffd98a' },
  // Aku's beetle drones: machines, so the foundry's presses crush them happily.
  drone: { prefix: 'Dron', health: 0.8, damage: 0.9, speed: 1.22, scale: 0.9, score: 1.1, windupMs: 430, accent: '#ffb347' },
  queen: { prefix: 'Ana Böcek', health: 5.6, damage: 1.5, speed: 0.6, scale: 1.75, score: 7, windupMs: 760, accent: '#ff8a1f' },
}

/** Machines are drawn by the procedural drone rig instead of a creature model. */
export const isMachineVariant = (variant: EnemyVariant) => variant === 'drone' || variant === 'queen'

/** Heavy variants plant their feet: no knockback, ground-shaking area strikes. */
export const isHeavyVariant = (variant: EnemyVariant) => variant === 'giant' || variant === 'queen'

const DRONE_NAMES: Partial<Record<EnemyKind, string>> = { 1: 'Böcek Dron', 2: 'Kıskaç Dron', 4: 'Topçu Dron', 5: 'Işın Dronu' }

/** Telegraph length per creature: heavy creatures swing slower and are easier to read. */
export const ENEMY_WINDUP_MS: Record<EnemyKind, number> = { 1: 380, 2: 440, 3: 640, 4: 520, 5: 560 }

export function enemyDisplayName(kind: EnemyKind, variant: EnemyVariant) {
  if (variant === 'giant' || variant === 'queen') return ENEMY_VARIANTS[variant].prefix
  if (variant === 'drone') return DRONE_NAMES[kind] ?? 'Böcek Dron'
  const prefix = ENEMY_VARIANTS[variant].prefix
  return prefix ? `${prefix} ${ENEMIES[kind].title}` : ENEMIES[kind].title
}

export const BOSS_DEFINITIONS = {
  swamp: { kind: 4 as EnemyKind, title: 'Aku’nun Gölgesi', health: 950, damage: 28, score: 2_000, bossType: 'shadow' as const },
  final: { kind: 5 as EnemyKind, title: 'Aku, Zamanın Efendisi', health: 1_450, damage: 38, score: 5_000, bossType: 'aku' as const },
} as const
