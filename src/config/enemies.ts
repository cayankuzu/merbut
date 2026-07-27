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
  1: { kind: 1, title: 'Myrkhan', ...enemyAsset(1), health: 70, damage: 13, speed: 1.65, attackRange: 1.55, attackCooldown: 1.55, score: 120, scale: 1.35, accent: '#ff6a42', ability: 'spin' },
  2: { kind: 2, title: 'Zorvex', ...enemyAsset(2), health: 90, damage: 16, speed: 1.3, attackRange: 1.75, attackCooldown: 1.8, score: 160, scale: 1.4, accent: '#c655ff', ability: 'dash' },
  3: { kind: 3, title: 'Kharzul', ...enemyAsset(3), health: 120, damage: 20, speed: 1.05, attackRange: 3.15, attackCooldown: 2.1, score: 210, scale: 1.55, accent: '#dcdf4c', ability: 'quake' },
  4: { kind: 4, title: 'Vhalgor', ...enemyAsset(4), health: 155, damage: 24, speed: 1.18, attackRange: 6.4, attackCooldown: 2.25, score: 280, scale: 1.52, accent: '#53e89c', ability: 'stone' },
  5: { kind: 5, title: 'Nexrath', ...enemyAsset(5), health: 190, damage: 28, speed: 1.28, attackRange: 7.2, attackCooldown: 2.05, score: 360, scale: 1.55, accent: '#58cbff', ability: 'dark-orb' },
}

export const ENEMY_NAMES = [
  'Myrkhan', 'Zorvex', 'Kharzul', 'Vhalgor', 'Nexrath',
  'Draxil', 'Qorvane', 'Azrukh', 'Velkris', 'Sythrak',
] as const

export const BOSS_DEFINITIONS = {
  swamp: { kind: 4 as EnemyKind, title: 'Aku’nun Gölgesi', health: 950, damage: 28, score: 2_000, bossType: 'shadow' as const },
  final: { kind: 5 as EnemyKind, title: 'Aku, Zamanın Efendisi', health: 1_450, damage: 38, score: 5_000, bossType: 'aku' as const },
} as const
