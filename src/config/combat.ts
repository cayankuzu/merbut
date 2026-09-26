import type { AttackStep } from '../store/gameStore'

/** Chain timings: two quick cuts, then a spinning finisher. */
export const ATTACK_DURATION: Record<AttackStep, number> = { 1: 0.62, 2: 0.56, 3: 0.82 }
export const CHAIN_WINDOW_MS = 950
/** Forward push per cut, in world units per second. */
export const LUNGE: Record<AttackStep, number> = { 1: 3, 2: 3.6, 3: 6.2 }
