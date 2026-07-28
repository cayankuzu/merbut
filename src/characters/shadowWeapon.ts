import { Bone, Vector3, type Object3D } from 'three'
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
const handWorld = new Vector3()
const forearmWorld = new Vector3()
const palmDirection = new Vector3()

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

/** Shadow-only socket pass: exact grip anchoring plus torso-safe attack arcs. */
export function updateShadowWeaponSocket(
  attachment: WeaponAttachment,
  torso: Bone | null,
  followHandRotation: boolean,
  delta: number,
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

  if (followHandRotation) keepWeaponOutsideTorso(
    attachment,
    torso,
    SHADOW_WEAPON_TRANSFORM,
    SHADOW_BLADE_REACH,
    SHADOW_TORSO_CLEARANCE,
  )
}
