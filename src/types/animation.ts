export type AnimationState = 'idle' | 'walk' | 'jump' | 'attack' | 'shield' | 'fireball' | 'dead'

export interface AnimationClipSet {
  idle: string
  walk: string
  jump: string
  attack: string
}
