import { Bone, Group, Quaternion, Vector3, type Object3D } from 'three'
import type { WeaponTransform } from '../types/character'
import { findRightHandBone } from '../utils/findBone'

const handWorldPosition = new Vector3()
const handWorldRotation = new Quaternion()
const rootWorldRotation = new Quaternion()
const targetSocketRotation = new Quaternion()
const alignmentRotation = new Quaternion()
const currentBladeDirection = new Vector3()
const palmWorldPosition = new Vector3()
const palmBoneWorldPosition = new Vector3()
const desiredBladeDirection = new Vector3(0, -1.08, 0.72).normalize()
const localBladeAxis = new Vector3()
const bladeRollRotation = new Quaternion()
const torsoWorldPosition = new Vector3()
const torsoOffset = new Vector3()
const guardedBladeDirection = new Vector3()
const safeBladeDirection = new Vector3()
const guardTangent = new Vector3()
const guardCorrection = new Quaternion()
const guardLocalCorrection = new Quaternion()
const guardRootWorldRotation = new Quaternion()
const guardRootWorldScale = new Vector3()
const socketWorldPosition = new Vector3()
const palmAnchorWorldPosition = new Vector3()
const forearmWorldPosition = new Vector3()
const forearmToHand = new Vector3()
const capsuleStartWorld = new Vector3()
const capsuleEndWorld = new Vector3()
const capsuleBladeEnd = new Vector3()
const capsuleClosestBlade = new Vector3()
const capsuleClosestBody = new Vector3()
const capsuleCandidateDirection = new Vector3()
const CAPSULE_ANGLE_STEP = Math.PI / 15
const CAPSULE_BINARY_STEPS = 5
const TORSO_BONE_NAMES = [
  'Spine2', 'Spine02', 'mixamorigSpine2',
  'Spine1', 'Spine01', 'mixamorigSpine1',
  'UpperChest', 'Chest', 'Spine', 'mixamorigSpine',
] as const
const TORSO_BONE_PATTERN = /(spine1|spine|chest)/i

const BODY_GUARD_BONES = {
  hips: ['Hips', 'mixamorigHips', 'Pelvis', 'pelvis', 'root_hips'],
  upperTorso: [
    'Spine', 'mixamorigSpine', 'mixamorigSpine2', 'mixamorigSpine1', 'UpperChest', 'Chest',
    'Spine01', 'Spine1', 'Spine02', 'Spine2',
  ],
  leftUpLeg: ['LeftUpLeg', 'mixamorigLeftUpLeg', 'LeftUpperLeg', 'upper_leg.L', 'thigh.L'],
  leftLeg: ['LeftLeg', 'mixamorigLeftLeg', 'LeftLowerLeg', 'lower_leg.L', 'shin.L'],
  leftFoot: ['LeftFoot', 'mixamorigLeftFoot', 'foot.L'],
  rightUpLeg: ['RightUpLeg', 'mixamorigRightUpLeg', 'RightUpperLeg', 'upper_leg.R', 'thigh.R'],
  rightLeg: ['RightLeg', 'mixamorigRightLeg', 'RightLowerLeg', 'lower_leg.R', 'shin.R'],
  rightFoot: ['RightFoot', 'mixamorigRightFoot', 'foot.R'],
} as const

const BODY_CAPSULE_LAYOUT = [
  { id: 'torso', start: 'hips', end: 'upperTorso', radius: 18 },
  { id: 'skirt-left', start: 'hips', end: 'leftLeg', radius: 19 },
  { id: 'skirt-right', start: 'hips', end: 'rightLeg', radius: 19 },
  { id: 'leg-left', start: 'leftUpLeg', end: 'leftFoot', radius: 11.5 },
  { id: 'leg-right', start: 'rightUpLeg', end: 'rightFoot', radius: 11.5 },
] as const

type BodyGuardBoneRole = keyof typeof BODY_GUARD_BONES

export interface WeaponBodyCapsule {
  id: (typeof BODY_CAPSULE_LAYOUT)[number]['id']
  start: Bone
  end: Bone
  radius: number
  projectedStart: Vector3
  projectedEnd: Vector3
  scaledRadius: number
}

export interface WeaponBodyGuard {
  capsules: WeaponBodyCapsule[]
}

export interface WeaponAttachment {
  root: Object3D
  hand: Bone
  palmBones: Bone[]
  socket: Group
  weapon: Object3D
  rawStableRotation: Quaternion
  stableRotation: Quaternion
  rotationOffset: Quaternion
  palmLerp: number
  bodyGuardTurnSign: -1 | 0 | 1
  detach: () => void
}

function findRigRoot(characterRoot: Object3D, hand: Bone) {
  let current: Object3D = hand
  while (current.parent && current.parent !== characterRoot) current = current.parent
  return current.parent === characterRoot ? current : characterRoot
}

function findPalmBones(hand: Bone) {
  const directBones = hand.children.filter((child): child is Bone => child instanceof Bone)
  const fingerBones = directBones.filter((bone) => /(thumb|index|middle|ring|pinky|little)/i.test(bone.name))
  return fingerBones.length > 0 ? fingerBones : directBones
}

function normalizeBoneName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function findBodyGuardBones(root: Object3D, role: BodyGuardBoneRole) {
  const candidates = BODY_GUARD_BONES[role]
  const normalizedCandidates = new Set<string>(candidates.map(normalizeBoneName))
  const matches: Bone[] = []
  root.traverse((node) => {
    if (node instanceof Bone && normalizedCandidates.has(normalizeBoneName(node.name))) {
      matches.push(node)
    }
  })
  return matches
}

function descendantDistance(node: Bone, ancestor: Bone | null) {
  if (!ancestor) return -1
  let current: Object3D | null = node
  let distance = 0
  while (current) {
    if (current === ancestor) return distance
    current = current.parent
    distance += 1
  }
  return -1
}

/** Builds the five cheap capsules shared by the Ali and Jack humanoid rigs. */
export function findWeaponBodyGuard(root: Object3D): WeaponBodyGuard {
  const matches = Object.fromEntries(
    (Object.keys(BODY_GUARD_BONES) as BodyGuardBoneRole[]).map((role) => [role, findBodyGuardBones(root, role)]),
  ) as Record<BodyGuardBoneRole, Bone[]>
  const hips = matches.hips[0] ?? null
  // Rigs disagree on whether their highest torso joint is named Spine,
  // Spine02 or UpperChest. Hierarchy depth is reliable for both shipped rigs
  // and standard Mixamo exports, so choose the furthest descendant of Hips.
  const upperTorso = matches.upperTorso.reduce<Bone | null>((best, candidate) => (
    descendantDistance(candidate, hips) > descendantDistance(best ?? candidate, hips)
      ? candidate
      : best ?? candidate
  ), null)
  const bones: Record<BodyGuardBoneRole, Bone | null> = {
    hips,
    upperTorso,
    leftUpLeg: matches.leftUpLeg[0] ?? null,
    leftLeg: matches.leftLeg[0] ?? null,
    leftFoot: matches.leftFoot[0] ?? null,
    rightUpLeg: matches.rightUpLeg[0] ?? null,
    rightLeg: matches.rightLeg[0] ?? null,
    rightFoot: matches.rightFoot[0] ?? null,
  }

  const capsules: WeaponBodyCapsule[] = []
  BODY_CAPSULE_LAYOUT.forEach((layout) => {
    const start = bones[layout.start]
    const end = bones[layout.end]
    if (start && end && start !== end) {
      capsules.push({
        ...layout,
        start,
        end,
        projectedStart: new Vector3(),
        projectedEnd: new Vector3(),
        scaledRadius: 0,
      })
    }
  })
  return { capsules }
}

export function findTorsoBone(root: Object3D) {
  for (const name of TORSO_BONE_NAMES) {
    const candidate = root.getObjectByName(name)
    if (candidate instanceof Bone) return candidate
  }
  let match: Bone | null = null
  root.traverse((node) => {
    if (!match && node instanceof Bone && TORSO_BONE_PATTERN.test(node.name)) match = node
  })
  return match
}

/** Returns the nearest blade direction that clears a torso capsule. */
export function constrainWeaponBladeDirection(
  currentDirection: Vector3,
  torsoFromGrip: Vector3,
  bladeReach: number,
  clearance: number,
  target = new Vector3(),
) {
  target.copy(currentDirection).normalize()
  const torsoDistance = torsoFromGrip.length()
  if (torsoDistance <= 0.0001) return target

  const inward = torsoOffset.copy(torsoFromGrip).multiplyScalar(1 / torsoDistance)
  const inwardDot = target.dot(inward)
  if (torsoDistance <= clearance) {
    if (inwardDot <= -0.12) return target
    // The grip can legitimately be close to the robe/chest. In that case a
    // tangent (with a slight outward bias) is the nearest safe blade path.
    target.addScaledVector(inward, -(inwardDot + 0.18))
    if (target.lengthSq() < 0.0001) target.set(-inward.y, inward.x, 0)
    return target.normalize()
  }
  if (inwardDot <= 0) return target
  const projection = torsoDistance * inwardDot
  if (projection >= bladeReach) return target
  const closestDistance = torsoDistance * Math.sqrt(Math.max(0, 1 - inwardDot * inwardDot))
  if (closestDistance >= clearance) return target

  const safeInwardDot = Math.sqrt(Math.max(0, 1 - (clearance / torsoDistance) ** 2))
  guardTangent.copy(target).addScaledVector(inward, -inwardDot)
  if (guardTangent.lengthSq() < 0.0001) guardTangent.set(-inward.y, inward.x, 0)
  guardTangent.normalize()
  return target
    .copy(guardTangent)
    .multiplyScalar(Math.sqrt(Math.max(0, 1 - safeInwardDot * safeInwardDot)))
    .addScaledVector(inward, safeInwardDot)
    .normalize()
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
    if (-d < 0) bladeNumerator = 0
    else if (-d > a) bladeNumerator = bladeDenominator
    else {
      bladeNumerator = -d
      bladeDenominator = a
    }
  } else if (bodyNumerator > bodyDenominator) {
    bodyNumerator = bodyDenominator
    if (b - d < 0) bladeNumerator = 0
    else if (b - d > a) bladeNumerator = bladeDenominator
    else {
      bladeNumerator = b - d
      bladeDenominator = a
    }
  }

  const bladeT = Math.abs(bladeNumerator) < 0.000001 ? 0 : bladeNumerator / Math.max(bladeDenominator, 0.000001)
  const bodyT = Math.abs(bodyNumerator) < 0.000001 ? 0 : bodyNumerator / Math.max(bodyDenominator, 0.000001)
  capsuleClosestBlade.set(ux * bladeT, uy * bladeT, 0)
  capsuleClosestBody.set(bodyStart.x + vx * bodyT, bodyStart.y + vy * bodyT, 0)
}

function projectedBladeCapsuleDistanceSquared(
  directionX: number,
  directionY: number,
  bodyStart: Vector3,
  bodyEnd: Vector3,
  bladeReach: number,
) {
  capsuleBladeEnd.set(directionX * bladeReach, directionY * bladeReach, 0)
  closestPointsBetweenProjectedSegments(capsuleBladeEnd, bodyStart, bodyEnd)
  return capsuleClosestBlade.distanceToSquared(capsuleClosestBody)
}

function isRotatedBladeClear(
  baseX: number,
  baseY: number,
  angle: number,
  bodyStart: Vector3,
  bodyEnd: Vector3,
  bladeReach: number,
  clearanceSquared: number,
) {
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  const directionX = baseX * cosine - baseY * sine
  const directionY = baseX * sine + baseY * cosine
  return projectedBladeCapsuleDistanceSquared(
    directionX,
    directionY,
    bodyStart,
    bodyEnd,
    bladeReach,
  ) >= clearanceSquared
}

function refineSafeCapsuleAngle(
  baseX: number,
  baseY: number,
  sign: -1 | 1,
  unsafeMagnitude: number,
  safeMagnitude: number,
  bodyStart: Vector3,
  bodyEnd: Vector3,
  bladeReach: number,
  clearanceSquared: number,
) {
  let low = unsafeMagnitude
  let high = safeMagnitude
  for (let iteration = 0; iteration < CAPSULE_BINARY_STEPS; iteration += 1) {
    const middle = (low + high) * 0.5
    if (isRotatedBladeClear(baseX, baseY, middle * sign, bodyStart, bodyEnd, bladeReach, clearanceSquared)) {
      high = middle
    } else {
      low = middle
    }
  }
  return high * sign
}

function isBodyBladeDirectionClear(
  guard: WeaponBodyGuard,
  directionX: number,
  directionY: number,
  bladeReach: number,
) {
  for (const capsule of guard.capsules) {
    if (projectedBladeCapsuleDistanceSquared(
      directionX,
      directionY,
      capsule.projectedStart,
      capsule.projectedEnd,
      bladeReach,
    ) < (capsule.scaledRadius * 1.015) ** 2) return false
  }
  return true
}

function isRotatedBodyBladeClear(
  guard: WeaponBodyGuard,
  baseX: number,
  baseY: number,
  angle: number,
  bladeReach: number,
) {
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  return isBodyBladeDirectionClear(
    guard,
    baseX * cosine - baseY * sine,
    baseX * sine + baseY * cosine,
    bladeReach,
  )
}

function refineSafeBodyAngle(
  guard: WeaponBodyGuard,
  baseX: number,
  baseY: number,
  sign: -1 | 1,
  unsafeMagnitude: number,
  safeMagnitude: number,
  bladeReach: number,
) {
  let low = unsafeMagnitude
  let high = safeMagnitude
  for (let iteration = 0; iteration < CAPSULE_BINARY_STEPS; iteration += 1) {
    const middle = (low + high) * 0.5
    if (isRotatedBodyBladeClear(guard, baseX, baseY, middle * sign, bladeReach)) high = middle
    else low = middle
  }
  return high * sign
}

/** Returns the nearest projected direction that clears one animated body capsule. */
export function constrainWeaponBladeAgainstCapsule(
  currentDirection: Vector3,
  bodyStartFromGrip: Vector3,
  bodyEndFromGrip: Vector3,
  bladeReach: number,
  clearance: number,
  target = new Vector3(),
  preferredTurn: -1 | 0 | 1 = 0,
) {
  target.copy(currentDirection).setZ(0)
  if (target.lengthSq() < 0.000001 || bladeReach <= 0 || clearance <= 0) return target
  target.normalize()

  const baseX = target.x
  const baseY = target.y
  const clearanceSquared = (clearance * 1.015) ** 2
  if (projectedBladeCapsuleDistanceSquared(
    baseX,
    baseY,
    bodyStartFromGrip,
    bodyEndFromGrip,
    bladeReach,
  ) >= clearanceSquared) return target

  let positiveSafe = 0
  let negativeSafe = 0
  const maxSteps = Math.ceil(Math.PI / CAPSULE_ANGLE_STEP)
  for (let step = 1; step <= maxSteps && (!positiveSafe || !negativeSafe); step += 1) {
    const magnitude = Math.min(Math.PI, step * CAPSULE_ANGLE_STEP)
    if (!positiveSafe && isRotatedBladeClear(
      baseX, baseY, magnitude, bodyStartFromGrip, bodyEndFromGrip, bladeReach, clearanceSquared,
    )) positiveSafe = magnitude
    if (!negativeSafe && isRotatedBladeClear(
      baseX, baseY, -magnitude, bodyStartFromGrip, bodyEndFromGrip, bladeReach, clearanceSquared,
    )) negativeSafe = magnitude
  }

  if (!positiveSafe && !negativeSafe) {
    capsuleCandidateDirection.copy(bodyStartFromGrip).add(bodyEndFromGrip).multiplyScalar(-0.5).setZ(0)
    return capsuleCandidateDirection.lengthSq() > 0.000001
      ? target.copy(capsuleCandidateDirection).normalize()
      : target.set(-baseY, baseX, 0).normalize()
  }

  const positiveAngle = positiveSafe
    ? refineSafeCapsuleAngle(
      baseX, baseY, 1, Math.max(0, positiveSafe - CAPSULE_ANGLE_STEP), positiveSafe,
      bodyStartFromGrip, bodyEndFromGrip, bladeReach, clearanceSquared,
    )
    : Number.POSITIVE_INFINITY
  const negativeAngle = negativeSafe
    ? refineSafeCapsuleAngle(
      baseX, baseY, -1, Math.max(0, negativeSafe - CAPSULE_ANGLE_STEP), negativeSafe,
      bodyStartFromGrip, bodyEndFromGrip, bladeReach, clearanceSquared,
    )
    : Number.NEGATIVE_INFINITY
  const positiveMagnitude = Math.abs(positiveAngle)
  const negativeMagnitude = Math.abs(negativeAngle)
  const nearlyEqual = Math.abs(positiveMagnitude - negativeMagnitude) < Math.PI / 36
  const fallbackTurn = preferredTurn || (baseY < -0.02 ? -1 : 1)
  const angle = nearlyEqual
    ? fallbackTurn > 0 ? positiveAngle : negativeAngle
    : positiveMagnitude < negativeMagnitude ? positiveAngle : negativeAngle
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  return target.set(baseX * cosine - baseY * sine, baseX * sine + baseY * cosine, 0).normalize()
}

/**
 * Rotates only around the hand-held grip while walking, keeping the blade out
 * of the animated torso, robe/skirt and both leg capsules.
 */
export function keepWeaponOutsideBody(
  attachment: WeaponAttachment,
  guard: WeaponBodyGuard,
  transform: WeaponTransform,
  bladeReach: number,
) {
  if (guard.capsules.length === 0) return false
  attachment.root.updateWorldMatrix(true, true)
  attachment.root.getWorldQuaternion(guardRootWorldRotation)
  attachment.root.getWorldScale(guardRootWorldScale)
  attachment.socket.updateWorldMatrix(true, false)
  attachment.socket.getWorldPosition(socketWorldPosition)

  guardedBladeDirection
    .set(...transform.bladeDirection)
    .normalize()
    .applyQuaternion(attachment.weapon.quaternion)
    .applyQuaternion(attachment.socket.quaternion)
    .applyQuaternion(guardRootWorldRotation)
    .setZ(0)
  if (guardedBladeDirection.lengthSq() < 0.000001) return false
  guardedBladeDirection.normalize()
  safeBladeDirection.copy(guardedBladeDirection)

  const rootScale = Math.max(guardRootWorldScale.x, guardRootWorldScale.y, guardRootWorldScale.z)
  const scaledReach = bladeReach * rootScale
  for (const capsule of guard.capsules) {
    capsuleStartWorld.setFromMatrixPosition(capsule.start.matrixWorld)
    capsuleEndWorld.setFromMatrixPosition(capsule.end.matrixWorld)
    capsule.projectedStart.copy(capsuleStartWorld).sub(socketWorldPosition).setZ(0)
    capsule.projectedEnd.copy(capsuleEndWorld).sub(socketWorldPosition).setZ(0)
    capsule.scaledRadius = capsule.radius * rootScale
  }

  const baseX = guardedBladeDirection.x
  const baseY = guardedBladeDirection.y
  if (isBodyBladeDirectionClear(guard, baseX, baseY, scaledReach)) return false

  let positiveSafe = 0
  let negativeSafe = 0
  const maxSteps = Math.ceil(Math.PI / CAPSULE_ANGLE_STEP)
  for (let step = 1; step <= maxSteps && (!positiveSafe || !negativeSafe); step += 1) {
    const magnitude = Math.min(Math.PI, step * CAPSULE_ANGLE_STEP)
    if (!positiveSafe && isRotatedBodyBladeClear(guard, baseX, baseY, magnitude, scaledReach)) positiveSafe = magnitude
    if (!negativeSafe && isRotatedBodyBladeClear(guard, baseX, baseY, -magnitude, scaledReach)) negativeSafe = magnitude
  }

  if (positiveSafe || negativeSafe) {
    const positiveAngle = positiveSafe
      ? refineSafeBodyAngle(
        guard, baseX, baseY, 1, Math.max(0, positiveSafe - CAPSULE_ANGLE_STEP), positiveSafe, scaledReach,
      )
      : Number.POSITIVE_INFINITY
    const negativeAngle = negativeSafe
      ? refineSafeBodyAngle(
        guard, baseX, baseY, -1, Math.max(0, negativeSafe - CAPSULE_ANGLE_STEP), negativeSafe, scaledReach,
      )
      : Number.NEGATIVE_INFINITY
    const positiveMagnitude = Math.abs(positiveAngle)
    const negativeMagnitude = Math.abs(negativeAngle)
    const nearlyEqual = Math.abs(positiveMagnitude - negativeMagnitude) < Math.PI / 36
    const fallbackTurn = attachment.bodyGuardTurnSign || (baseY < -0.02 ? -1 : 1)
    const angle = nearlyEqual
      ? fallbackTurn > 0 ? positiveAngle : negativeAngle
      : positiveMagnitude < negativeMagnitude ? positiveAngle : negativeAngle
    const cosine = Math.cos(angle)
    const sine = Math.sin(angle)
    safeBladeDirection.set(baseX * cosine - baseY * sine, baseX * sine + baseY * cosine, 0).normalize()
  } else {
    const torsoCapsule = guard.capsules[0]
    safeBladeDirection
      .copy(torsoCapsule.projectedStart)
      .add(torsoCapsule.projectedEnd)
      .multiplyScalar(-0.5)
      .setZ(0)
    if (safeBladeDirection.lengthSq() < 0.000001) safeBladeDirection.set(-baseY, baseX, 0)
    safeBladeDirection.normalize()
  }

  const turn = baseX * safeBladeDirection.y - baseY * safeBladeDirection.x
  if (Math.abs(turn) > 0.0001) attachment.bodyGuardTurnSign = turn > 0 ? 1 : -1
  guardCorrection.setFromUnitVectors(guardedBladeDirection, safeBladeDirection)
  guardLocalCorrection
    .copy(guardRootWorldRotation)
    .invert()
    .multiply(guardCorrection)
    .multiply(guardRootWorldRotation)
  attachment.socket.quaternion.premultiply(guardLocalCorrection)
  return true
}

/** Rotates around the fixed grip only when an animated blade would cut the torso. */
export function keepWeaponOutsideTorso(
  attachment: WeaponAttachment,
  torso: Bone | null,
  transform: WeaponTransform,
  bladeReach: number,
  clearance: number,
) {
  if (!torso) return
  attachment.root.updateWorldMatrix(true, false)
  attachment.root.getWorldQuaternion(guardRootWorldRotation)
  attachment.root.getWorldScale(guardRootWorldScale)
  torso.updateWorldMatrix(true, false)
  torso.getWorldPosition(torsoWorldPosition)
  attachment.socket.updateWorldMatrix(true, false)
  attachment.socket.getWorldPosition(socketWorldPosition)
  // The game and roster are read from a frontal camera. Guard the projected
  // silhouette as well as the 3D pose so a blade cannot look as if it exits
  // through the robe merely because it passed just in front of it in Z.
  torsoOffset.copy(torsoWorldPosition).sub(socketWorldPosition).setZ(0)

  guardedBladeDirection
    .set(...transform.bladeDirection)
    .normalize()
    .applyQuaternion(attachment.weapon.quaternion)
    .applyQuaternion(attachment.socket.quaternion)
    .applyQuaternion(guardRootWorldRotation)
    .setZ(0)
    .normalize()
  if (guardedBladeDirection.lengthSq() < 0.0001 || torsoOffset.lengthSq() < 0.0001) return
  const rootScale = Math.max(guardRootWorldScale.x, guardRootWorldScale.y, guardRootWorldScale.z)
  constrainWeaponBladeDirection(
    guardedBladeDirection,
    torsoOffset,
    bladeReach * rootScale,
    clearance * rootScale,
    safeBladeDirection,
  )
  if (safeBladeDirection.dot(guardedBladeDirection) > 0.99999) return
  guardCorrection.setFromUnitVectors(guardedBladeDirection, safeBladeDirection)
  guardLocalCorrection
    .copy(guardRootWorldRotation)
    .invert()
    .multiply(guardCorrection)
    .multiply(guardRootWorldRotation)
  attachment.socket.quaternion.premultiply(guardLocalCorrection)
}

function getHandRotationInRootSpace(attachment: WeaponAttachment, target: Quaternion) {
  attachment.root.getWorldQuaternion(rootWorldRotation)
  attachment.hand.getWorldQuaternion(handWorldRotation)
  return target.copy(rootWorldRotation).invert().multiply(handWorldRotation)
}

export function attachWeapon(
  characterRoot: Object3D,
  weapon: Object3D,
  transform: WeaponTransform,
): WeaponAttachment {
  const hand = findRightHandBone(characterRoot)
  if (!hand) throw new Error('Right-hand bone could not be found for the weapon socket.')
  const rigRoot = findRigRoot(characterRoot, hand)

  const socket = new Group()
  socket.name = 'WeaponSocket'
  rigRoot.add(socket)
  socket.add(weapon)
  rigRoot.updateWorldMatrix(true, true)

  const attachment: WeaponAttachment = {
    root: rigRoot,
    hand,
    palmBones: findPalmBones(hand),
    socket,
    weapon,
    rawStableRotation: new Quaternion(),
    stableRotation: new Quaternion(),
    rotationOffset: new Quaternion(),
    palmLerp: transform.palmLerp ?? 0.48,
    bodyGuardTurnSign: 0,
    detach: () => {
      socket.remove(weapon)
      rigRoot.remove(socket)
    },
  }

  getHandRotationInRootSpace(attachment, socket.quaternion)
  attachment.rawStableRotation.copy(socket.quaternion)
  alignWeaponAttachment(attachment, transform)
  updateWeaponSocket(attachment, false, 1)
  return attachment
}

export function updateWeaponSocket(
  attachment: WeaponAttachment,
  followHandRotation: boolean,
  delta: number,
) {
  attachment.root.updateWorldMatrix(true, false)
  attachment.hand.updateWorldMatrix(true, false)
  attachment.hand.getWorldPosition(handWorldPosition)
  if (attachment.palmBones.length > 0) {
    palmWorldPosition.set(0, 0, 0)
    attachment.palmBones.forEach((bone) => {
      bone.updateWorldMatrix(true, false)
      bone.getWorldPosition(palmBoneWorldPosition)
      palmWorldPosition.add(palmBoneWorldPosition)
    })
    palmWorldPosition.multiplyScalar(1 / attachment.palmBones.length)
    handWorldPosition.lerp(palmWorldPosition, attachment.palmLerp)
  }
  attachment.socket.position.copy(attachment.root.worldToLocal(handWorldPosition))
  if (attachment.palmBones.length === 0) attachment.socket.position.y += 0.2

  const target = followHandRotation
    ? getHandRotationInRootSpace(attachment, targetSocketRotation).multiply(attachment.rotationOffset)
    : attachment.stableRotation
  const blend = 1 - Math.exp(-Math.min(delta, 0.1) * (followHandRotation ? 22 : 14))
  attachment.socket.quaternion.slerp(target, blend)
}

/**
 * Moves a wrist-based rig socket into the palm along its animated forearm-hand
 * axis. Only the socket position changes; authored blade rotation stays intact.
 */
export function placeWeaponGripInPalm(attachment: WeaponAttachment, reach: number) {
  const forearm = attachment.hand.parent
  if (!forearm || reach === 0) return false
  attachment.root.updateWorldMatrix(true, false)
  forearm.updateWorldMatrix(true, false)
  attachment.hand.updateWorldMatrix(true, false)
  forearm.getWorldPosition(forearmWorldPosition)
  attachment.hand.getWorldPosition(palmAnchorWorldPosition)
  forearmToHand.copy(palmAnchorWorldPosition).sub(forearmWorldPosition)
  palmAnchorWorldPosition.addScaledVector(forearmToHand, reach)
  attachment.socket.position.copy(attachment.root.worldToLocal(palmAnchorWorldPosition))
  return true
}

export function alignWeaponAttachment(
  attachment: WeaponAttachment,
  transform: WeaponTransform,
) {
  attachment.palmLerp = transform.palmLerp ?? 0.48
  applyWeaponTransform(attachment.weapon, transform)

  // Hz. Ali'nin kılıcı gibi, sanat yönetimi tarafından verilen eksen dönüşü
  // doğrudan kullanılacak silahlar otomatik yön telafisine girmemelidir.
  if (transform.alignBlade === false) {
    attachment.stableRotation.copy(attachment.rawStableRotation)
    attachment.rotationOffset.identity()
    attachment.socket.quaternion.copy(attachment.stableRotation)
    return
  }

  currentBladeDirection
    .set(...transform.bladeDirection)
    .normalize()
    .applyEuler(attachment.weapon.rotation)
    .applyQuaternion(attachment.rawStableRotation)
    .normalize()
  alignmentRotation.setFromUnitVectors(currentBladeDirection, desiredBladeDirection)
  attachment.stableRotation
    .copy(attachment.rawStableRotation)
    .premultiply(alignmentRotation)
  attachment.rotationOffset
    .copy(attachment.rawStableRotation)
    .invert()
    .multiply(attachment.stableRotation)
  attachment.socket.quaternion.copy(attachment.stableRotation)
}

export function applyWeaponTransform(weapon: Object3D, transform: WeaponTransform) {
  weapon.rotation.set(...transform.rotation)
  if (transform.bladeRoll) {
    localBladeAxis.set(...transform.bladeDirection).normalize()
    bladeRollRotation.setFromAxisAngle(localBladeAxis, transform.bladeRoll)
    weapon.quaternion.multiply(bladeRollRotation)
  }
  weapon.scale.set(...transform.scale)
  const gripOffset = new Vector3(...transform.gripPoint)
    .multiply(weapon.scale)
    .applyQuaternion(weapon.quaternion)
  weapon.position.set(...transform.position).sub(gripOffset)
}
