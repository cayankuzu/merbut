import type { MenuAttackEffectKind } from './MenuAttackEffect'

export const SHOWCASE_MOVES_PER_CHARACTER = 2

export interface ShowcaseMoveProgress {
  characterComplete: boolean
  moveNumber: number
}

/**
 * Advances one menu combatant by a completed showcase move. Character swaps
 * are driven by this move count rather than by a wall-clock carousel timer.
 */
export function advanceShowcaseMove(completedMoves: number): ShowcaseMoveProgress {
  const moveNumber = Math.min(SHOWCASE_MOVES_PER_CHARACTER, Math.max(0, completedMoves) + 1)
  return {
    characterComplete: moveNumber === SHOWCASE_MOVES_PER_CHARACTER,
    moveNumber,
  }
}

export function getMenuAttackDurationMs(kind: MenuAttackEffectKind) {
  if (kind === 'ali-fireball' || kind === 'jack-shield') return 2_050
  if (kind === 'projectile' || kind.startsWith('projectile-')) return 1_850
  if (kind === 'ali-slash' || kind === 'jack-slash' || kind === 'slash') return 1_650
  if (kind === 'flame' || kind === 'shockwave') return 1_700
  return 1_500
}
