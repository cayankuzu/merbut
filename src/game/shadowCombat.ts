import type { EnemySpecial } from '../types/session'

export type ShadowAttackChoice = 'approach' | 'meteor' | 'slash' | 'double' | 'triple'

export function chooseShadowAttack(roll: number, distance: number, attackRange: number): ShadowAttackChoice {
  if (distance > attackRange && roll >= 0.18) return 'approach'
  if (roll < 0.26) return 'meteor'
  if (roll < 0.52) return 'slash'
  if (roll > 0.82) return 'triple'
  return 'double'
}

export function getShadowStrikeThresholds(special: EnemySpecial) {
  if (special === 'shadow-slash') return [480]
  return special === 'combo-triple' ? [620, 1_420, 2_280] : [720, 1_650]
}
