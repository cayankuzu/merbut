import { Box3, Vector3 } from 'three'
import { computeRosterPreviewFit, getRosterPreviewDistance } from './rosterPreviewFit'

describe('roster preview framing', () => {
  it('centers the complete model around the user rotation pivot', () => {
    const bounds = new Box3(new Vector3(-1, 0, -0.5), new Vector3(1, 4, 0.5))
    const fit = computeRosterPreviewFit(bounds)

    expect(fit.center).toEqual([0, 2, 0])
    expect(fit.modelOffset).toEqual([0, 0, 0])
    expect(fit.halfHeight).toBe(2)
    expect(fit.horizontalRadius).toBeCloseTo(Math.hypot(1, 0.5), 6)
  })

  it('keeps an off-center weapon inside the frame through a 360 degree rotation', () => {
    const bounds = new Box3(new Vector3(2, 0, -1), new Vector3(4, 2, 1))
    const fit = computeRosterPreviewFit(bounds)

    expect(fit.center).toEqual([0, 1, 0])
    expect(fit.modelOffset).toEqual([-3, 0, 0])
    expect(fit.halfHeight).toBe(1)
    expect(fit.horizontalRadius).toBeCloseTo(Math.SQRT2, 6)
  })

  it('increases distance for narrow preview panels without changing wide-panel vertical fit', () => {
    const fit = { halfHeight: 2.4, horizontalRadius: 1.1 }
    const narrow = getRosterPreviewDistance(fit, 34, 0.25)
    const square = getRosterPreviewDistance(fit, 34, 1)
    const wide = getRosterPreviewDistance(fit, 34, 2)

    expect(narrow).toBeGreaterThan(square)
    expect(wide).toBeCloseTo(square, 6)
    expect(square).toBeGreaterThan(fit.horizontalRadius + fit.halfHeight / Math.tan(17 * Math.PI / 180))
  })

  it('returns finite conservative defaults for unavailable bounds and invalid camera input', () => {
    const fit = computeRosterPreviewFit(new Box3())
    const distance = getRosterPreviewDistance({ halfHeight: Number.NaN, horizontalRadius: Number.NaN }, Number.NaN, 0)

    expect(fit).toEqual({ center: [0, 1.25, 0], halfHeight: 1.5, horizontalRadius: 1.1, modelOffset: [0, 0, 0] })
    expect(Number.isFinite(distance)).toBe(true)
    expect(distance).toBeGreaterThan(fit.halfHeight)
  })
})
