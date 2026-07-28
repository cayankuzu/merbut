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
const TORSO_BONE_NAMES = [
  'Spine2', 'Spine02', 'mixamorigSpine2',
  'Spine1', 'Spine01', 'mixamorigSpine1',
  'UpperChest', 'Chest', 'Spine', 'mixamorigSpine',
] as const
const TORSO_BONE_PATTERN = /(spine1|spine|chest)/i

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

  const attachment = {
    root: rigRoot,
    hand,
    palmBones: findPalmBones(hand),
    socket,
    weapon,
    rawStableRotation: new Quaternion(),
    stableRotation: new Quaternion(),
    rotationOffset: new Quaternion(),
    palmLerp: transform.palmLerp ?? 0.48,
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
