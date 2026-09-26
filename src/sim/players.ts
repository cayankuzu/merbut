import { DIFFICULTIES, type Difficulty } from '../config/difficulty'
import type { CharacterId } from '../types/character'
import type { PlayerStatus } from '../types/session'

export const ABILITY_MAX_CHARGE = 100
export const COMBO_WINDOW_MS = 2_200

export const HERO_NAMES: Record<CharacterId, string> = { ali: 'Hz. Ali', jack: 'Samuray Jack' }

export interface PlayerRunStatus extends PlayerStatus {
  combo: number
  comboUntil: number
  bestCombo: number
}

export function createPlayer(difficulty: Difficulty): PlayerRunStatus {
  const rules = DIFFICULTIES[difficulty]
  return {
    health: rules.playerHealth,
    maxHealth: rules.playerHealth,
    lives: rules.playerLives,
    score: 0,
    kills: 0,
    dead: false,
    respawnAt: 0,
    invulnerableUntil: 0,
    abilityActiveUntil: 0,
    abilityCharge: 0,
    abilityShots: 0,
    lastAbilityShotAt: -Infinity,
    healOverTime: 0,
    frozenUntil: 0,
    dodgeUntil: 0,
    combo: 0,
    comboUntil: 0,
    bestCombo: 0,
  }
}

export function recoverPlayer<T extends PlayerStatus>(player: T, amount: number): T {
  if (player.dead || amount <= 0 || player.health >= player.maxHealth) return player
  return { ...player, health: Math.min(player.maxHealth, player.health + amount) }
}

/** Boss checkpoints widen the health pool and fill both abilities, never lives. */
export function bossCheckpoint<T extends PlayerStatus>(player: T, maxHealth: number, now: number): T {
  return {
    ...player,
    maxHealth,
    health: player.dead ? 0 : maxHealth,
    abilityActiveUntil: 0,
    abilityCharge: ABILITY_MAX_CHARGE,
    abilityShots: 0,
    lastAbilityShotAt: -Infinity,
    invulnerableUntil: now + 2_000,
  }
}

export function mapPlayers<T>(players: Record<CharacterId, T>, update: (player: T, id: CharacterId) => T): Record<CharacterId, T> {
  return { ali: update(players.ali, 'ali'), jack: update(players.jack, 'jack') }
}
