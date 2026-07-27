import type { BossPhase, EnemyState, GamePhase } from '../types/session'

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

