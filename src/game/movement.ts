import { MathUtils } from 'three'

export interface MovementStepInput {
  x: number
  y: number
  velocityX: number
  velocityY: number
  axis: -1 | 0 | 1
  jumpRequested: boolean
  grounded: boolean
  delta: number
  groundHeight: number
  leftBound: number
  rightBound: number
  maxSpeed: number
  acceleration: number
  deceleration: number
  gravity: number
  jumpVelocity: number
}

export interface MovementStepResult {
  x: number
  y: number
  velocityX: number
  velocityY: number
  grounded: boolean
}

interface CoopBoundsInput {
  characterLeft: number
  characterRight: number
  lockedLeft: number
  lockedRight: number
  otherX: number
  otherAlive: boolean
  maxDistance: number
}

export function resolveCoopBounds(input: CoopBoundsInput) {
  return {
    left: Math.max(input.characterLeft, input.lockedLeft, input.otherAlive ? input.otherX - input.maxDistance : input.characterLeft),
    right: Math.min(input.characterRight, input.lockedRight, input.otherAlive ? input.otherX + input.maxDistance : input.characterRight),
  }
}

export function resolveCoopAxis(x: number, otherX: number, axis: -1 | 0 | 1, otherAlive: boolean, maxDistance: number) {
  if (!otherAlive) return axis
  const separation = Math.abs(x - otherX)
  const movingAway = (x - otherX) * axis > 0
  return separation >= maxDistance && movingAway ? 0 : axis
}

export function stepMovement(input: MovementStepInput): MovementStepResult {
  const desiredVelocity = input.axis * input.maxSpeed
  const rate = input.axis === 0 ? input.deceleration : input.acceleration
  let velocityX = MathUtils.damp(input.velocityX, desiredVelocity, rate, input.delta)
  let velocityY = input.jumpRequested ? input.jumpVelocity : input.velocityY
  velocityY += input.gravity * input.delta

  let x = MathUtils.clamp(input.x + velocityX * input.delta, input.leftBound, input.rightBound)
  let y = input.y + velocityY * input.delta
  let grounded = false

  if (y <= input.groundHeight) {
    y = input.groundHeight
    velocityY = 0
    grounded = true
  }

  if (x === input.leftBound || x === input.rightBound) velocityX = 0

  return { x, y, velocityX, velocityY, grounded }
}
