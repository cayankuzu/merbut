import { Box3, MathUtils, Vector3 } from 'three'

export interface RosterPreviewFit {
  center: readonly [number, number, number]
  halfHeight: number
  horizontalRadius: number
  modelOffset: readonly [number, number, number]
}

export const ROSTER_CAMERA_PADDING = 1.28

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
 * sphere that contains its complete AABB through unrestricted yaw and pitch.
 */
export function computeRosterPreviewFit(bounds: Box3): RosterPreviewFit {
  if (bounds.isEmpty()) return {
    center: [0, 0, 0],
    halfHeight: FALLBACK_HALF_HEIGHT,
    horizontalRadius: FALLBACK_HORIZONTAL_RADIUS,
    modelOffset: [0, 0, 0],
  }

  const boundsCenter = bounds.getCenter(new Vector3())
  const size = bounds.getSize(new Vector3())
  const halfWidth = Math.max(MIN_EXTENT, finiteOr(size.x / 2, FALLBACK_HORIZONTAL_RADIUS))
  const halfHeight = Math.max(MIN_EXTENT, finiteOr(size.y / 2, FALLBACK_HALF_HEIGHT))
  const halfDepth = Math.max(MIN_EXTENT, finiteOr(size.z / 2, FALLBACK_HORIZONTAL_RADIUS))
  const radius = Math.hypot(halfWidth, halfHeight, halfDepth)

  return {
    center: [0, 0, 0],
    halfHeight: radius,
    horizontalRadius: radius,
    modelOffset: [
      centeredOffset(boundsCenter.x),
      centeredOffset(boundsCenter.y),
      centeredOffset(boundsCenter.z),
    ],
  }
}

/** Returns the camera distance required to contain the complete framing sphere. */
export function getRosterPreviewDistance(
  fit: Pick<RosterPreviewFit, 'halfHeight' | 'horizontalRadius'>,
  verticalFovDegrees: number,
  aspect: number,
  padding = ROSTER_CAMERA_PADDING,
) {
  const halfHeight = Math.max(MIN_EXTENT, finiteOr(fit.halfHeight, FALLBACK_HALF_HEIGHT))
  const horizontalRadius = Math.max(MIN_EXTENT, finiteOr(fit.horizontalRadius, FALLBACK_HORIZONTAL_RADIUS))
  const verticalHalfFov = MathUtils.degToRad(MathUtils.clamp(finiteOr(verticalFovDegrees, 34), 10, 120) / 2)
  const safeAspect = Math.max(0.1, finiteOr(aspect, 1))
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * safeAspect)
  const verticalDistance = halfHeight / Math.sin(verticalHalfFov)
  const horizontalDistance = horizontalRadius / Math.sin(horizontalHalfFov)
  return Math.max(verticalDistance, horizontalDistance) * Math.max(1, finiteOr(padding, ROSTER_CAMERA_PADDING))
}
