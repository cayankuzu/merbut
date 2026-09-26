import { ATTACK_DURATION } from '../config/combat'
import type { MenuAttackEffectKind } from './MenuAttackEffect'

export const SHOWCASE_MOVES_PER_CHARACTER = 2

/** When each cut of the heroes' three-cut chain starts, and how long the chain runs. */
export const HERO_COMBO_OFFSETS_MS = [0, ATTACK_DURATION[1] * 1_000, (ATTACK_DURATION[1] + ATTACK_DURATION[2]) * 1_000] as const
export const HERO_COMBO_MS = (ATTACK_DURATION[1] + ATTACK_DURATION[2] + ATTACK_DURATION[3]) * 1_000

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
  if (kind === 'ali-slash' || kind === 'jack-slash') return HERO_COMBO_MS + 50
  if (kind === 'ali-fireball' || kind === 'jack-shield') return 2_050
  if (kind === 'projectile' || kind.startsWith('projectile-')) return 1_850
  if (kind === 'slash') return 1_650
  if (kind === 'flame' || kind === 'shockwave') return 1_700
  return 1_500
}
