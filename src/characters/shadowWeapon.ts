import { Bone, Quaternion, Vector3, type Object3D } from 'three'
import { SHADOW_WEAPON_TRANSFORM } from '../config/characterTransforms'
import {
  constrainWeaponBladeDirection,
  findTorsoBone,
  keepWeaponOutsideTorso,
  updateWeaponSocket,
  type WeaponAttachment,
} from './WeaponSocket'

const SHADOW_BLADE_REACH = 128
const SHADOW_TORSO_CLEARANCE = 18
const SHADOW_PALM_REACH = 0.55
const SHADOW_BODY_GUARD_LAYOUT = [
  { id: 'head', start: ['neck', 'Neck'], end: ['Head', 'head'], radius: 11.5 },
  { id: 'torso', start: ['Hips', 'hips'], end: ['Spine02', 'Spine2', 'Spine01', 'Spine1'], radius: 20 },
  { id: 'robe-left', start: ['Hips', 'hips'], end: ['LeftLeg'], radius: 20.5 },
  { id: 'robe-right', start: ['Hips', 'hips'], end: ['RightLeg'], radius: 20.5 },
  { id: 'left-upper-arm', start: ['LeftArm'], end: ['LeftForeArm'], radius: 8.5 },
  { id: 'left-forearm', start: ['LeftForeArm'], end: ['LeftHand'], radius: 7 },
  { id: 'right-upper-arm', start: ['RightArm'], end: ['RightForeArm'], radius: 8.5 },
  // Leave only the final palm section unguarded: the grip may touch the hand,
  // but the blade must not pass through the animated forearm.
  { id: 'right-forearm', start: ['RightForeArm'], end: ['RightHand'], radius: 6.5, endT: 0.72 },
  { id: 'left-leg', start: ['LeftUpLeg'], end: ['LeftFoot'], radius: 11.5 },
  { id: 'right-leg', start: ['RightUpLeg'], end: ['RightFoot'], radius: 11.5 },
  { id: 'left-foot', start: ['LeftFoot'], end: ['LeftToeBase'], radius: 8 },
  { id: 'right-foot', start: ['RightFoot'], end: ['RightToeBase'], radius: 8 },
] as const
const handWorld = new Vector3()
const forearmWorld = new Vector3()
const palmDirection = new Vector3()
const socketWorld = new Vector3()
const rootWorldScale = new Vector3()
const rootWorldRotation = new Quaternion()
const currentBladeDirection = new Vector3()
const safeBladeDirection = new Vector3()
const guardCorrection = new Quaternion()
const localGuardCorrection = new Quaternion()
const capsuleStartWorld = new Vector3()
const capsuleEndWorld = new Vector3()
const capsuleBladeEnd = new Vector3()
const capsuleClosestBlade = new Vector3()
const capsuleClosestBody = new Vector3()
const capsuleCandidateDirection = new Vector3()
const shadowBodyCenterFromGrip = new Vector3()
const SHADOW_GUARD_COARSE_STEP = Math.PI / 12
const SHADOW_GUARD_BINARY_STEPS = 5
const SHADOW_GUARD_CLEARANCE_MARGIN = 1.03

export interface ShadowBodyCapsule {
  id: (typeof SHADOW_BODY_GUARD_LAYOUT)[number]['id']
  start: Bone
  end: Bone
  radius: number
  startT: number
  endT: number
  startFromGrip: Vector3
  endFromGrip: Vector3
  clearanceSquared: number
}

export interface ShadowWeaponBodyGuard {
  capsules: ShadowBodyCapsule[]
  turnSign: -1 | 0 | 1
}

function normalizeBoneName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function findShadowBone(root: Object3D, names: readonly string[]) {
  for (const name of names) {
    const candidate = root.getObjectByName(name)
    if (candidate instanceof Bone) return candidate
  }
  const normalized = new Set(names.map(normalizeBoneName))
  let match: Bone | null = null
  root.traverse((node) => {
    if (!match && node instanceof Bone && normalized.has(normalizeBoneName(node.name))) match = node
  })
  return match
}

/** Shadow-rig-specific animated capsules; the weapon hand itself is excluded. */
export function findShadowWeaponBodyGuard(root: Object3D): ShadowWeaponBodyGuard {
  const capsules: ShadowBodyCapsule[] = []
  SHADOW_BODY_GUARD_LAYOUT.forEach((layout) => {
    const start = findShadowBone(root, layout.start)
    const end = findShadowBone(root, layout.end)
    if (!start || !end || start === end) return
    capsules.push({
      id: layout.id,
      start,
      end,
      radius: layout.radius,
      startT: 0,
      endT: 'endT' in layout ? layout.endT : 1,
      startFromGrip: new Vector3(),
      endFromGrip: new Vector3(),
      clearanceSquared: 0,
    })
  })
  return { capsules, turnSign: 0 }
}

export function findShadowTorsoBone(root: Object3D) {
  return findTorsoBone(root)
}

/**
 * Keeps the blade segment outside a small torso capsule while retaining as
 * much of the authored slash direction as possible.
 */
export function constrainShadowBladeDirection(
  currentDirection: Vector3,
  torsoFromHand: Vector3,
  bladeReach = SHADOW_BLADE_REACH,
  clearance = SHADOW_TORSO_CLEARANCE,
  target = new Vector3(),
) {
  return constrainWeaponBladeDirection(currentDirection, torsoFromHand, bladeReach, clearance, target)
}

function closestPointsBetweenProjectedSegments(
  bladeEnd: Vector3,
  bodyStart: Vector3,
  bodyEnd: Vector3,
) {
  const ux = bladeEnd.x
  const uy = bladeEnd.y
  const vx = bodyEnd.x - bodyStart.x
  const vy = bodyEnd.y - bodyStart.y
  const wx = -bodyStart.x
  const wy = -bodyStart.y
  const a = ux * ux + uy * uy
  const b = ux * vx + uy * vy
  const c = vx * vx + vy * vy
  const d = ux * wx + uy * wy
  const e = vx * wx + vy * wy
  const denominator = a * c - b * b
  let bladeNumerator = 0
  let bladeDenominator = denominator
  let bodyNumerator = 0
  let bodyDenominator = denominator

  if (denominator < 0.000001) {
    bladeNumerator = 0
    bladeDenominator = 1
    bodyNumerator = e
    bodyDenominator = c
  } else {
    bladeNumerator = b * e - c * d
    bodyNumerator = a * e - b * d
    if (bladeNumerator < 0) {
      bladeNumerator = 0
      bodyNumerator = e
      bodyDenominator = c
    } else if (bladeNumerator > bladeDenominator) {
      bladeNumerator = bladeDenominator
      bodyNumerator = e + b
      bodyDenominator = c
    }
  }

  if (bodyNumerator < 0) {
    bodyNumerator = 0
    bladeDenominator = a
    bladeNumerator = Math.max(0, Math.min(bladeDenominator, -d))
  } else if (bodyNumerator > bodyDenominator) {
    bodyNumerator = bodyDenominator
    bladeDenominator = a
    bladeNumerator = Math.max(0, Math.min(bladeDenominator, b - d))
  }

  const bladeT = Math.abs(bladeNumerator) < 0.000001 ? 0 : bladeNumerator / Math.max(bladeDenominator, 0.000001)
  const bodyT = Math.abs(bodyNumerator) < 0.000001 ? 0 : bodyNumerator / Math.max(bodyDenominator, 0.000001)
  capsuleClosestBlade.set(ux * bladeT, uy * bladeT, 0)
  capsuleClosestBody.set(bodyStart.x + vx * bodyT, bodyStart.y + vy * bodyT, 0)
}

/** Finds the closest blade direction that clears one animated shadow capsule. */
export function constrainShadowBladeAgainstCapsule(
  currentDirection: Vector3,
  bodyStartFromGrip: Vector3,
  bodyEndFromGrip: Vector3,
  bladeReach: number,
  clearance: number,
  target = new Vector3(),
) {
  target.copy(currentDirection).setZ(0)
  if (target.lengthSq() < 0.000001 || bladeReach <= 0 || clearance <= 0) return target
  target.normalize()

  for (let pass = 0; pass < 3; pass += 1) {
    capsuleBladeEnd.copy(target).multiplyScalar(bladeReach)
    closestPointsBetweenProjectedSegments(capsuleBladeEnd, bodyStartFromGrip, bodyEndFromGrip)
    if (capsuleClosestBlade.distanceToSquared(capsuleClosestBody) >= clearance * clearance) break
    constrainShadowBladeDirection(
      target,
      capsuleClosestBody,
      bladeReach,
      clearance,
      capsuleCandidateDirection,
    )
    if (capsuleCandidateDirection.dot(target) > 0.999999) break
    target.copy(capsuleCandidateDirection)
  }
  return target.normalize()
}

function isShadowBodyDirectionClear(
  guard: ShadowWeaponBodyGuard,
  directionX: number,
  directionY: number,
  bladeReach: number,
) {
  for (let index = 0; index < guard.capsules.length; index += 1) {
    const capsule = guard.capsules[index]!
    // Guard both sides of the grip. The katana mesh has a short pommel on the
    // reverse axis and the long blade on the forward axis; treating the full
    // held line conservatively prevents either half from clipping the robe as
    // the wrist rolls during the walk cycle.
    capsuleBladeEnd.set(directionX * bladeReach, directionY * bladeReach, 0)
    closestPointsBetweenProjectedSegments(
      capsuleBladeEnd,
      capsule.startFromGrip,
      capsule.endFromGrip,
    )
    if (capsuleClosestBlade.distanceToSquared(capsuleClosestBody) < capsule.clearanceSquared) return false
    capsuleBladeEnd.set(-directionX * bladeReach, -directionY * bladeReach, 0)
    closestPointsBetweenProjectedSegments(
      capsuleBladeEnd,
      capsule.startFromGrip,
      capsule.endFromGrip,
    )
    if (capsuleClosestBlade.distanceToSquared(capsuleClosestBody) < capsule.clearanceSquared) return false
  }
  return true
}

function isRotatedShadowBodyDirectionClear(
  guard: ShadowWeaponBodyGuard,
  baseX: number,
  baseY: number,
  angle: number,
  bladeReach: number,
) {
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  return isShadowBodyDirectionClear(
    guard,
    baseX * cosine - baseY * sine,
    baseX * sine + baseY * cosine,
    bladeReach,
  )
}

function refineSafeShadowBodyAngle(
  guard: ShadowWeaponBodyGuard,
  baseX: number,
  baseY: number,
  sign: -1 | 1,
  unsafeMagnitude: number,
  safeMagnitude: number,
  bladeReach: number,
) {
  let low = unsafeMagnitude
  let high = safeMagnitude
  for (let iteration = 0; iteration < SHADOW_GUARD_BINARY_STEPS; iteration += 1) {
    const middle = (low + high) * 0.5
    if (isRotatedShadowBodyDirectionClear(guard, baseX, baseY, middle * sign, bladeReach)) high = middle
    else low = middle
  }
  return high * sign
}

/**
 * Walking-only guard. It rotates around the fixed palm socket, so the hilt
 * never drifts while the blade clears the torso, robe, limbs and feet.
 */
export function keepShadowWeaponOutsideBody(
  attachment: WeaponAttachment,
  guard: ShadowWeaponBodyGuard,
) {
  if (guard.capsules.length === 0) return false
  attachment.root.updateWorldMatrix(true, true)
  attachment.root.getWorldQuaternion(rootWorldRotation)
  attachment.root.getWorldScale(rootWorldScale)
  attachment.socket.updateWorldMatrix(true, false)
  attachment.socket.getWorldPosition(socketWorld)

  currentBladeDirection
    .set(...SHADOW_WEAPON_TRANSFORM.bladeDirection)
    .normalize()
    .applyQuaternion(attachment.weapon.quaternion)
    .applyQuaternion(attachment.socket.quaternion)
    .applyQuaternion(rootWorldRotation)
    .setZ(0)
  if (currentBladeDirection.lengthSq() < 0.000001) return false
  currentBladeDirection.normalize()

  const scale = Math.max(rootWorldScale.x, rootWorldScale.y, rootWorldScale.z)
  const reach = SHADOW_BLADE_REACH * scale
  shadowBodyCenterFromGrip.set(0, 0, 0)
  for (let index = 0; index < guard.capsules.length; index += 1) {
    const capsule = guard.capsules[index]!
    capsule.start.getWorldPosition(capsuleStartWorld)
    capsule.end.getWorldPosition(capsuleEndWorld)
    capsule.startFromGrip
      .copy(capsuleStartWorld)
      .lerp(capsuleEndWorld, capsule.startT)
      .sub(socketWorld)
      .setZ(0)
    capsule.endFromGrip
      .copy(capsuleStartWorld)
      .lerp(capsuleEndWorld, capsule.endT)
      .sub(socketWorld)
      .setZ(0)
    const clearance = capsule.radius * scale * SHADOW_GUARD_CLEARANCE_MARGIN
    capsule.clearanceSquared = clearance * clearance
    shadowBodyCenterFromGrip.add(capsule.startFromGrip).add(capsule.endFromGrip)
  }

  const baseX = currentBladeDirection.x
  const baseY = currentBladeDirection.y
  if (isShadowBodyDirectionClear(guard, baseX, baseY, reach)) return false

  let positiveAngle = Number.POSITIVE_INFINITY
  let negativeAngle = Number.POSITIVE_INFINITY
  const maxSteps = Math.ceil(Math.PI / SHADOW_GUARD_COARSE_STEP)
  for (let step = 1; step <= maxSteps; step += 1) {
    const magnitude = Math.min(Math.PI, step * SHADOW_GUARD_COARSE_STEP)
    const lower = Math.max(0, magnitude - SHADOW_GUARD_COARSE_STEP)
    const positiveClears = isRotatedShadowBodyDirectionClear(guard, baseX, baseY, magnitude, reach)
    const negativeClears = isRotatedShadowBodyDirectionClear(guard, baseX, baseY, -magnitude, reach)
    if (!positiveClears && !negativeClears) continue
    if (positiveClears) {
      positiveAngle = refineSafeShadowBodyAngle(guard, baseX, baseY, 1, lower, magnitude, reach)
    }
    if (negativeClears) {
      negativeAngle = refineSafeShadowBodyAngle(guard, baseX, baseY, -1, lower, magnitude, reach)
    }
    break
  }

  let safeAngle = 0
  if (Number.isFinite(positiveAngle) && Number.isFinite(negativeAngle)) {
    const difference = Math.abs(positiveAngle) - Math.abs(negativeAngle)
    if (Math.abs(difference) > 0.0001) {
      safeAngle = difference < 0 ? positiveAngle : negativeAngle
    } else if (guard.turnSign !== 0) {
      safeAngle = guard.turnSign > 0 ? positiveAngle : negativeAngle
    } else {
      const cosine = Math.cos(positiveAngle)
      const sine = Math.sin(positiveAngle)
      const positiveDot = (baseX * cosine - baseY * sine) * shadowBodyCenterFromGrip.x
        + (baseX * sine + baseY * cosine) * shadowBodyCenterFromGrip.y
      const negativeDot = (baseX * cosine + baseY * sine) * shadowBodyCenterFromGrip.x
        + (-baseX * sine + baseY * cosine) * shadowBodyCenterFromGrip.y
      safeAngle = positiveDot <= negativeDot ? positiveAngle : negativeAngle
    }
  } else if (Number.isFinite(positiveAngle)) {
    safeAngle = positiveAngle
  } else if (Number.isFinite(negativeAngle)) {
    safeAngle = negativeAngle
  } else {
    // A hand outside all capsules always has an escape half-plane. This is a
    // defensive fallback for degenerate projected poses.
    safeAngle = (guard.turnSign || 1) * Math.PI
  }

  const cosine = Math.cos(safeAngle)
  const sine = Math.sin(safeAngle)
  safeBladeDirection.set(
    baseX * cosine - baseY * sine,
    baseX * sine + baseY * cosine,
    0,
  )
  if (Math.abs(safeAngle) > 0.0001) guard.turnSign = safeAngle > 0 ? 1 : -1
  guardCorrection.setFromUnitVectors(currentBladeDirection, safeBladeDirection)
  localGuardCorrection
    .copy(rootWorldRotation)
    .invert()
    .multiply(guardCorrection)
    .multiply(rootWorldRotation)
  attachment.socket.quaternion.premultiply(localGuardCorrection)
  return true
}

/** Shadow-only socket pass: exact grip anchoring plus torso-safe attack arcs. */
export function updateShadowWeaponSocket(
  attachment: WeaponAttachment,
  torso: Bone | null,
  followHandRotation: boolean,
  delta: number,
  bodyGuard: ShadowWeaponBodyGuard | null = null,
  guardFullBody = false,
) {
  updateWeaponSocket(attachment, followHandRotation, delta)

  // Shadow rig has no finger bones and RightHand is a wrist joint. Extend a
  // small, rig-relative distance beyond the forearm so the hilt sits in the
  // palm instead of floating at the wrist throughout slash/combo clips.
  attachment.hand.getWorldPosition(handWorld)
  const forearm = attachment.hand.parent
  if (forearm) {
    forearm.getWorldPosition(forearmWorld)
    palmDirection.copy(handWorld).sub(forearmWorld)
    handWorld.addScaledVector(palmDirection, SHADOW_PALM_REACH)
  }
  attachment.socket.position.copy(attachment.root.worldToLocal(handWorld))

  if (!followHandRotation) return
  if (guardFullBody && bodyGuard) {
    keepShadowWeaponOutsideBody(attachment, bodyGuard)
    return
  }
  keepWeaponOutsideTorso(
    attachment,
    torso,
    SHADOW_WEAPON_TRANSFORM,
    SHADOW_BLADE_REACH,
    SHADOW_TORSO_CLEARANCE,
  )
}
