export type GalleryRotation = readonly [yaw: number, pitch: number]

export const GALLERY_ROTATION_SENSITIVITY = 0.012

/** Unbounded yaw/pitch keeps both axes capable of repeated full 360-degree turns. */
export function applyGalleryRotationDrag(
  start: GalleryRotation,
  deltaX: number,
  deltaY: number,
  sensitivity = GALLERY_ROTATION_SENSITIVITY,
): GalleryRotation {
  return [
    start[0] + deltaX * sensitivity,
    start[1] + deltaY * sensitivity,
  ]
}
