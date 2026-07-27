export function getEffectiveAttackRange(attackRange: number, scale: number, ranged: boolean) {
  return ranged ? attackRange : Math.max(attackRange, scale * 1.45)
}

export function shouldEnemyApproach(distance: number, attackRange: number, scale: number, ranged: boolean) {
  return distance > getEffectiveAttackRange(attackRange, scale, ranged)
}

export function enemyCatchUpMultiplier(distance: number, boss: boolean) {
  if (distance <= 3.2) return 1
  const maximum = boss ? 3.6 : 4.6
  return Math.min(maximum, 1 + (distance - 3.2) * (boss ? 0.28 : 0.38))
}
