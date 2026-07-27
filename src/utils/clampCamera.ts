import { MathUtils } from 'three'

export function clampCameraX(value: number, bounds: readonly [number, number]) {
  return MathUtils.clamp(value, bounds[0], bounds[1])
}
