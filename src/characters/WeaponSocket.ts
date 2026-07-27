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
  weapon.scale.set(...transform.scale)
  const gripOffset = new Vector3(...transform.gripPoint)
    .multiply(weapon.scale)
    .applyEuler(weapon.rotation)
  weapon.position.set(...transform.position).sub(gripOffset)
}
