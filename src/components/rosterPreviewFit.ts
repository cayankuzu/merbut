import { Box3, MathUtils, Vector3 } from 'three'

export interface RosterPreviewFit {
  center: readonly [number, number, number]
  halfHeight: number
  horizontalRadius: number
  modelOffset: readonly [number, number, number]
}

const FALLBACK_HALF_HEIGHT = 1.5
const FALLBACK_HORIZONTAL_RADIUS = 1.1
const MIN_EXTENT = 0.25

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback
}

function centeredOffset(value: number) {
  const offset = -finiteOr(value, 0)
  return Math.abs(offset) < Number.EPSILON ? 0 : offset
}

/**
 * Centers a roster model on its rotation pivot and returns a conservative
 * cylinder that contains its complete AABB through a 360 degree Y rotation.
 */
export function computeRosterPreviewFit(bounds: Box3): RosterPreviewFit {
  if (bounds.isEmpty()) return {
    center: [0, 1.25, 0],
    halfHeight: FALLBACK_HALF_HEIGHT,
    horizontalRadius: FALLBACK_HORIZONTAL_RADIUS,
    modelOffset: [0, 0, 0],
  }

  const boundsCenter = bounds.getCenter(new Vector3())
  const size = bounds.getSize(new Vector3())
  const halfWidth = Math.max(MIN_EXTENT, finiteOr(size.x / 2, FALLBACK_HORIZONTAL_RADIUS))
  const halfDepth = Math.max(MIN_EXTENT, finiteOr(size.z / 2, FALLBACK_HORIZONTAL_RADIUS))

  return {
    center: [0, finiteOr(boundsCenter.y, 1.25), 0],
    halfHeight: Math.max(MIN_EXTENT, finiteOr(size.y / 2, FALLBACK_HALF_HEIGHT)),
    horizontalRadius: Math.hypot(halfWidth, halfDepth),
    modelOffset: [centeredOffset(boundsCenter.x), 0, centeredOffset(boundsCenter.z)],
  }
}

/** Returns the camera distance required to contain the complete framing cylinder. */
export function getRosterPreviewDistance(
  fit: Pick<RosterPreviewFit, 'halfHeight' | 'horizontalRadius'>,
  verticalFovDegrees: number,
  aspect: number,
  padding = 1.12,
) {
  const halfHeight = Math.max(MIN_EXTENT, finiteOr(fit.halfHeight, FALLBACK_HALF_HEIGHT))
  const horizontalRadius = Math.max(MIN_EXTENT, finiteOr(fit.horizontalRadius, FALLBACK_HORIZONTAL_RADIUS))
  const verticalHalfFov = MathUtils.degToRad(MathUtils.clamp(finiteOr(verticalFovDegrees, 34), 10, 120) / 2)
  const safeAspect = Math.max(0.1, finiteOr(aspect, 1))
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * safeAspect)
  const verticalDistance = horizontalRadius + halfHeight / Math.tan(verticalHalfFov)
  const horizontalDistance = horizontalRadius + horizontalRadius / Math.tan(horizontalHalfFov)
  return Math.max(verticalDistance, horizontalDistance) * Math.max(1, finiteOr(padding, 1.12))
}
