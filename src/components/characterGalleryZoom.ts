export const GALLERY_ZOOM_MIN = 0.32
export const GALLERY_ZOOM_MAX = 4.5

export function applyGalleryWheelZoom(currentZoom: number, wheelDeltaY: number) {
  const requested = currentZoom - wheelDeltaY * 0.0012
  return Math.max(GALLERY_ZOOM_MIN, Math.min(GALLERY_ZOOM_MAX, requested))
}
