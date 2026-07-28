import { applyGalleryRotationDrag, GALLERY_ROTATION_SENSITIVITY } from './characterGalleryRotation'

describe('character gallery rotation', () => {
  it('maps left-drag movement to independent yaw and pitch', () => {
    const rotation = applyGalleryRotationDrag([0.4, -0.2], 100, -50)

    expect(rotation[0]).toBeCloseTo(0.4 + 100 * GALLERY_ROTATION_SENSITIVITY)
    expect(rotation[1]).toBeCloseTo(-0.2 - 50 * GALLERY_ROTATION_SENSITIVITY)
  })

  it('does not clamp pitch before or after a complete 360-degree turn', () => {
    const fullTurnPixels = Math.PI * 2 / GALLERY_ROTATION_SENSITIVITY
    const once = applyGalleryRotationDrag([0, 0], 0, fullTurnPixels)
    const twice = applyGalleryRotationDrag(once, 0, fullTurnPixels)

    expect(once[1]).toBeCloseTo(Math.PI * 2)
    expect(twice[1]).toBeCloseTo(Math.PI * 4)
  })
})
