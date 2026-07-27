import type { AnimationState } from '../types/animation'

interface AnimationConditions {
  attacking: boolean
  grounded: boolean
  speed: number
}

export function resolveAnimationState({
  attacking,
  grounded,
  speed,
}: AnimationConditions): AnimationState {
  if (attacking) return 'attack'
  if (!grounded) return 'jump'
  if (speed > 0.2) return 'walk'
  return 'idle'
}
