import type { CharacterId } from './character'
import type { EnemyKind, EnemyVariant } from '../config/enemies'
import type { Difficulty } from '../config/difficulty'

export type GamePhase = 'menu' | 'controls' | 'prologue' | 'countdown' | 'boss-intro' | 'final-intro' | 'playing' | 'paused' | 'ending' | 'demo-end' | 'victory' | 'defeat'
export type EnemyAnimation = 'idle' | 'walk' | 'attack' | 'dead'
export type BossPhase = 'none' | 'offering' | 'drinking' | 'arrival' | 'prayer' | 'aku-arrival' | 'countdown' | 'fight' | 'complete' | 'defeated' | 'portal' | 'falling' | 'continued'
export type BossForm = 'normal' | 'monster'
export type BossType = 'shadow' | 'aku'
export type EnemySpecial = 'none' | 'shadow-slash' | 'combo-double' | 'combo-triple' | 'meteor' | 'aku-melee' | 'aku-heavy' | 'aku-ranged' | 'aku-fire-rain' | 'aku-time-portal' | 'aku-split' | 'aku-shapeshift' | 'aku-spin'
export type ImpactKind = 'ember' | 'void' | 'quake' | 'stone' | 'frost' | 'boss' | 'holy' | 'portal'
export type PlayerAttackSource = 'melee' | 'fireball'

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
  /** Dash invulnerability; a strike blocked inside it counts as a perfect dodge. */
  dodgeUntil: number
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
  variant: EnemyVariant
  /** Visual depth lane so a crowd never stands inside itself or the heroes. */
  z: number
  /** Knockback velocity (units/s); decays every combat step. */
  vx: number
  /** Hit-stun or mechanic stun: no movement or attack before this time. */
  stunUntil: number
  /** Non-zero while a telegraphed attack is winding up; it lands at this time. */
  windupUntil: number
  spawnedAt: number
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
  /** Set when a hero's blade sent the shot back towards its thrower. */
  reflectedBy?: CharacterId
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

/**
 * What a feed toast or portal alert says, kept apart from its text so the HUD
 * can read it in the player's current language (they may switch mid-run).
 */
export type FeedMessage =
  | { key: 'heroDown'; hero: CharacterId; seconds: number }
  | { key: 'heroOut'; hero: CharacterId }
  | { key: 'heroFrozen'; hero: CharacterId }
  | { key: 'shadowDispelled' }

export type PortalAlertMessage =
  | { key: 'portalAmbush'; biome: number; count: number }
  | { key: 'portalOpened' }

export interface FeedItem {
  id: string
  /** The text in the language it was raised in; the HUD re-reads `message` when there is one. */
  text: string
  message?: FeedMessage
  tone: 'kill' | 'pickup' | 'system' | 'damage'
  expiresAt: number
}

export interface PortalAlertState {
  /** Title and detail in the language the alert was raised in; the HUD re-reads `message`. */
  title: string
  detail: string
  message: PortalAlertMessage
  expiresAt: number
}

export interface SessionSnapshot {
  difficulty: Difficulty
  bossPhase: BossPhase
}
