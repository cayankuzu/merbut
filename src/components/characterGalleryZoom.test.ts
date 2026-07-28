import { applyGalleryWheelZoom, GALLERY_ZOOM_MAX, GALLERY_ZOOM_MIN } from './characterGalleryZoom'

describe('character gallery zoom', () => {
  it('allows a detailed close-up up to 450 percent', () => {
    expect(applyGalleryWheelZoom(1, -10_000)).toBe(GALLERY_ZOOM_MAX)
  })

  it('allows large bosses to zoom out to 32 percent', () => {
    expect(applyGalleryWheelZoom(1, 10_000)).toBe(GALLERY_ZOOM_MIN)
  })

  it('changes zoom smoothly within its bounds', () => {
    expect(applyGalleryWheelZoom(1, -100)).toBeCloseTo(1.12)
  })
})
