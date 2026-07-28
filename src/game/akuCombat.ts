import type { BossPhase, EnemyState, GamePhase } from '../types/session'

export const AKU_FIRE_SPIKE_RADIUS = 3.2
export const AKU_FIRE_SPIKE_MAX_PLAYER_Y = 0.9
export const AKU_FIRE_SPIKE_DAMAGE_COOLDOWN_MS = 650
export const AKU_FIRE_SPIKE_DAMAGE_MULTIPLIER = 0.34

interface AkuFightState {
  phase: GamePhase
  bossPhase: BossPhase
  activeBossId: string | null
}

export function isActiveAkuFight(state: AkuFightState, enemy: EnemyState | undefined) {
  return Boolean(
    enemy
      && state.phase === 'playing'
      && state.bossPhase === 'fight'
      && state.activeBossId === enemy.id
      && enemy.finalBoss
      && enemy.bossType === 'aku'
      && enemy.animation !== 'dead',
  )
}

export function isInsideAkuFireSpikeField(akuX: number, playerX: number, playerY: number) {
  return Math.abs(playerX - akuX) <= AKU_FIRE_SPIKE_RADIUS
    && playerY <= AKU_FIRE_SPIKE_MAX_PLAYER_Y
}
