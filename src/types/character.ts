import type { AnimationClipSet } from './animation'
import type { PlayerBindings } from './controls'

export type CharacterId = 'ali' | 'jack'
export type Vec3Tuple = [number, number, number]

export interface WeaponTransform {
  bladeDirection: Vec3Tuple
  gripPoint: Vec3Tuple
  palmLerp?: number
  position: Vec3Tuple
  rotation: Vec3Tuple
  scale: Vec3Tuple
}

export interface CharacterTransform {
  modelScale: number
  modelPosition: Vec3Tuple
  modelRotation: Vec3Tuple
  weapon: WeaponTransform
}

export interface CharacterDefinition {
  id: CharacterId
  displayName: string
  accent: string
  startPosition: Vec3Tuple
  bindings: PlayerBindings
  assets: AnimationClipSet & { sword: string }
  jumpSubclip?: { startFrame: number; endFrame: number; fps: number }
}
