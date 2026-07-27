import type { CharacterId } from './character'
import type { EnemyKind } from '../config/enemies'
import type { Difficulty } from '../config/difficulty'

export type GamePhase = 'menu' | 'controls' | 'countdown' | 'boss-intro' | 'final-intro' | 'playing' | 'paused' | 'ending' | 'victory' | 'defeat'
export type EnemyAnimation = 'idle' | 'walk' | 'attack' | 'dead'
export type BossPhase = 'none' | 'offering' | 'drinking' | 'arrival' | 'prayer' | 'aku-arrival' | 'countdown' | 'fight' | 'complete' | 'defeated' | 'portal' | 'falling' | 'continued'
export type BossForm = 'normal' | 'monster'
export type BossType = 'shadow' | 'aku'
export type EnemySpecial = 'none' | 'combo-double' | 'combo-triple' | 'meteor' | 'aku-melee' | 'aku-heavy' | 'aku-ranged' | 'aku-fire-rain' | 'aku-time-portal' | 'aku-split' | 'aku-shapeshift' | 'aku-spin'
export type ImpactKind = 'ember' | 'void' | 'quake' | 'stone' | 'frost' | 'boss' | 'holy' | 'portal'

export interface PlayerStatus {
  health: number
  maxHealth: number
  lives: number
  score: number
  kills: number
  dead: boolean
  respawnAt: number
  invulnerableUntil: number
  abilityActiveUntil: number
  abilityCharge: number
  abilityShots: number
  lastAbilityShotAt: number
  healOverTime: number
  frozenUntil: number
}

export interface EnemyState {
  id: string
  biome: number
  kind: EnemyKind
  title: string
  x: number
  health: number
  maxHealth: number
  damage: number
  speed: number
  attackRange: number
  attackCooldown: number
  score: number
  scale: number
  accent: string
  direction: -1 | 1
  animation: EnemyAnimation
  attackUntil: number
  nextAttackAt: number
  deadAt: number
  lastHitBy: CharacterId | null
  boss: boolean
  finalBoss: boolean
  bossType: BossType | null
  bossForm: BossForm
  mimicKind: EnemyKind | null
  special: EnemySpecial
  specialStartedAt: number
  specialUntil: number
  nextSpecialAt: number
  specialHitMask: number
  nextAuraAt: number
}

export interface ProjectileState {
  id: string
  owner: 'ali'
  x: number
  y: number
  z: number
  directionX: number
  directionZ: number
  travelled: number
}

export interface PickupState {
  id: string
  x: number
  type: 'zemzem'
}

export interface EnemyProjectileState {
  id: string
  kind: 'stone' | 'dark-orb' | 'time-portal' | 'aku-fire'
  sourceId: string
  x: number
  y: number
  targetX: number
  damage: number
  travelled: number
}

export interface CombatImpactState {
  id: string
  kind: ImpactKind
  x: number
  y: number
  createdAt: number
  duration: number
  lethal: boolean
}

export interface MeteorState {
  id: string
  x: number
  createdAt: number
  impactAt: number
  landedAt: number
  damage: number
  kind: 'shadow' | 'fire'
}

export interface FeedItem {
  id: string
  text: string
  tone: 'kill' | 'pickup' | 'system' | 'damage'
  expiresAt: number
}

export interface SessionSnapshot {
  difficulty: Difficulty
  bossPhase: BossPhase
}
