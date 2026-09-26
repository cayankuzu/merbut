import { describe, expect, it } from 'vitest'
import { resolveCoopAxis, resolveCoopBounds, stepMovement } from './movement'

const base = {
  x: 0,
  y: 0,
  velocityX: 0,
  velocityY: 0,
  axis: 0 as const,
  jumpRequested: false,
  grounded: true,
  delta: 1 / 60,
  groundHeight: 0,
  leftBound: -10,
  rightBound: 10,
  maxSpeed: 4,
  acceleration: 30,
  deceleration: 36,
  gravity: -20,
  jumpVelocity: 8,
}

describe('stepMovement', () => {
  it('accelerates toward the requested direction', () => {
    const result = stepMovement({ ...base, axis: 1 })
    expect(result.x).toBeGreaterThan(0)
    expect(result.velocityX).toBeGreaterThan(0)
  })

  it('starts a jump and leaves the ground', () => {
    const result = stepMovement({ ...base, jumpRequested: true })
    expect(result.y).toBeGreaterThan(0)
    expect(result.grounded).toBe(false)
  })

  it('can apply a second jump impulse while airborne', () => {
    const airborne = stepMovement({ ...base, y: 1.2, velocityY: 2, grounded: false, jumpRequested: true, jumpVelocity: 9.15 })
    expect(airborne.velocityY).toBeGreaterThan(8)
    expect(airborne.y).toBeGreaterThan(1.2)
  })

  it('never crosses the world bounds', () => {
    const result = stepMovement({ ...base, x: 9.99, velocityX: 8, axis: 1, rightBound: 10 })
    expect(result.x).toBeLessThanOrEqual(10)
  })

  it('removes the co-op leash when the other hero is out of combat', () => {
    const bounds = resolveCoopBounds({ characterLeft: -5, characterRight: 239, lockedLeft: -4.8, lockedRight: 25.75, otherX: -1, otherAlive: false, maxDistance: 7.2 })
    expect(bounds).toEqual({ left: -4.8, right: 25.75 })
    expect(resolveCoopAxis(8, -1, 1, false, 7.2)).toBe(1)
    expect(resolveCoopAxis(8, -1, 1, true, 7.2)).toBe(0)
  })
})
