import { Box3, Vector3 } from 'three'
import { computeRosterPreviewFit, getRosterPreviewDistance, ROSTER_CAMERA_PADDING } from './rosterPreviewFit'

describe('roster preview framing', () => {
  it('centers the complete model around the user rotation pivot', () => {
    const bounds = new Box3(new Vector3(-1, 0, -0.5), new Vector3(1, 4, 0.5))
    const fit = computeRosterPreviewFit(bounds)

    expect(fit.center).toEqual([0, 0, 0])
    expect(fit.modelOffset).toEqual([0, -2, 0])
    expect(fit.halfHeight).toBeCloseTo(Math.hypot(1, 2, 0.5), 6)
    expect(fit.horizontalRadius).toBeCloseTo(Math.hypot(1, 2, 0.5), 6)
  })

  it('keeps an off-center weapon inside the frame through a 360 degree rotation', () => {
    const bounds = new Box3(new Vector3(2, 0, -1), new Vector3(4, 2, 1))
    const fit = computeRosterPreviewFit(bounds)

    expect(fit.center).toEqual([0, 0, 0])
    expect(fit.modelOffset).toEqual([-3, -1, 0])
    expect(fit.halfHeight).toBeCloseTo(Math.sqrt(3), 6)
    expect(fit.horizontalRadius).toBeCloseTo(Math.sqrt(3), 6)
  })

  it('increases distance for narrow preview panels without changing wide-panel vertical fit', () => {
    const fit = { halfHeight: 2.4, horizontalRadius: 1.1 }
    const narrow = getRosterPreviewDistance(fit, 34, 0.25)
    const square = getRosterPreviewDistance(fit, 34, 1)
    const wide = getRosterPreviewDistance(fit, 34, 2)

    expect(narrow).toBeGreaterThan(square)
    expect(wide).toBeCloseTo(square, 6)
    expect(square).toBeCloseTo(fit.halfHeight / Math.sin(17 * Math.PI / 180) * ROSTER_CAMERA_PADDING, 6)
  })

  it('keeps a generous default safety border around the complete model', () => {
    const fit = { halfHeight: 2.4, horizontalRadius: 1.4 }
    const tight = getRosterPreviewDistance(fit, 34, 1, 1)
    const padded = getRosterPreviewDistance(fit, 34, 1)

    expect(ROSTER_CAMERA_PADDING).toBeGreaterThanOrEqual(1.25)
    expect(padded).toBeCloseTo(tight * ROSTER_CAMERA_PADDING, 6)
  })

  it('returns finite conservative defaults for unavailable bounds and invalid camera input', () => {
    const fit = computeRosterPreviewFit(new Box3())
    const distance = getRosterPreviewDistance({ halfHeight: Number.NaN, horizontalRadius: Number.NaN }, Number.NaN, 0)

    expect(fit).toEqual({ center: [0, 0, 0], halfHeight: 1.5, horizontalRadius: 1.1, modelOffset: [0, 0, 0] })
    expect(Number.isFinite(distance)).toBe(true)
    expect(distance).toBeGreaterThan(fit.halfHeight)
  })
})
