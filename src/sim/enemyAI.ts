export function getEffectiveAttackRange(attackRange: number, scale: number, ranged: boolean) {
  return ranged ? attackRange : Math.max(attackRange, scale * 1.45)
}

export function shouldEnemyApproach(distance: number, attackRange: number, scale: number, ranged: boolean) {
  return distance > getEffectiveAttackRange(attackRange, scale, ranged)
}

/** Minimum distance a creature keeps from a hero's body (and vice versa). */
export function heroGap(scale: number) {
  return 0.55 + scale * 0.28
}

export function enemyCatchUpMultiplier(distance: number, boss: boolean) {
  if (distance <= 3.2) return 1
  const maximum = boss ? 3.6 : 4.6
  return Math.min(maximum, 1 + (distance - 3.2) * (boss ? 0.28 : 0.38))
}
