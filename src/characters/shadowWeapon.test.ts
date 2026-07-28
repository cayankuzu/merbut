import { Bone, Group, Object3D, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { SHADOW_WEAPON_TRANSFORM } from '../config/characterTransforms'
import { attachWeapon } from './WeaponSocket'
import {
  constrainShadowBladeAgainstCapsule,
  constrainShadowBladeDirection,
  findShadowWeaponBodyGuard,
  keepShadowWeaponOutsideBody,
  updateShadowWeaponSocket,
} from './shadowWeapon'

describe('Aku\'nun Gölgesi weapon presentation', () => {
  it('pins the authored hilt point inside the palm beyond the wrist joint', () => {
    const character = new Group()
    const rig = new Group()
    const hand = new Bone()
    hand.name = 'RightHand'
    hand.position.set(0, 10, 0)
    rig.add(hand)
    character.add(rig)
    const weapon = new Object3D()
    const attachment = attachWeapon(character, weapon, SHADOW_WEAPON_TRANSFORM)

    updateShadowWeaponSocket(attachment, null, false, 1)
    character.updateWorldMatrix(true, true)
    const hiltWorld = weapon.localToWorld(new Vector3(...SHADOW_WEAPON_TRANSFORM.gripPoint))
    const expectedPalm = new Vector3(0, 15.5, 0)

    expect(hiltWorld.distanceTo(expectedPalm)).toBeLessThan(0.00001)
    attachment.detach()
  })

  it('bends only a torso-crossing blade direction to the clearance tangent', () => {
    const crossing = constrainShadowBladeDirection(
      new Vector3(1, 0, 0),
      new Vector3(10, 0, 0),
      30,
      3,
    )
    const closestDistance = 10 * Math.sqrt(1 - crossing.x ** 2)
    expect(closestDistance).toBeCloseTo(3, 5)
    expect(crossing.x).toBeGreaterThan(0)

    const outward = new Vector3(-1, 0, 0)
    expect(constrainShadowBladeDirection(outward, new Vector3(10, 0, 0), 30, 3).equals(outward)).toBe(true)

    const nearTorso = constrainShadowBladeDirection(
      new Vector3(1, 0, 0),
      new Vector3(2, 0, 0),
      30,
      3,
    )
    expect(nearTorso.x).toBeLessThan(0)
  })

  it('builds shadow-only guards for the robe, legs, feet, arms and head but not the weapon hand', () => {
    const root = new Group()
    ;[
      'neck', 'Head', 'Hips', 'Spine02',
      'LeftArm', 'LeftForeArm', 'LeftHand',
      'RightArm', 'RightForeArm', 'RightHand',
      'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase',
      'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase',
    ].forEach((name) => {
      const bone = new Bone()
      bone.name = name
      root.add(bone)
    })

    const guard = findShadowWeaponBodyGuard(root)

    expect(guard.capsules.map(({ id }) => id)).toEqual([
      'head', 'torso', 'robe-left', 'robe-right',
      'left-upper-arm', 'left-forearm', 'right-upper-arm', 'right-forearm',
      'left-leg', 'right-leg', 'left-foot', 'right-foot',
    ])
    const forearmGuard = guard.capsules.find(({ id }) => id === 'right-forearm')
    expect(forearmGuard?.endT).toBe(0.72)
    expect(guard.capsules
      .filter(({ start, end }) => start.name === 'RightHand' || end.name === 'RightHand')
      .every(({ endT }) => endT < 1)).toBe(true)
  })

  it('turns a walking blade around an animated robe capsule without changing an outward path', () => {
    const crossing = constrainShadowBladeAgainstCapsule(
      new Vector3(1, 0, 0),
      new Vector3(1, -1, 0),
      new Vector3(1, 1, 0),
      3,
      0.3,
    )
    expect(crossing.x).toBeGreaterThan(0)
    expect(Math.abs(crossing.y)).toBeGreaterThan(0.1)

    const outward = new Vector3(-1, 0, 0)
    expect(constrainShadowBladeAgainstCapsule(
      outward,
      new Vector3(1, -1, 0),
      new Vector3(1, 1, 0),
      3,
      0.3,
    ).equals(outward)).toBe(true)
  })

  it('keeps the hilt pinned to the palm while the walking guard changes only the socket angle', () => {
    const character = new Group()
    const rig = new Bone()
    const forearm = new Bone()
    forearm.position.set(-2, 0, 0)
    const hand = new Bone()
    hand.name = 'RightHand'
    hand.position.set(-2, 0, 0)
    forearm.add(hand)
    rig.add(forearm)
    character.add(rig)

    const hips = new Bone()
    hips.name = 'Hips'
    hips.position.set(0, -1, 0)
    const spine = new Bone()
    spine.name = 'Spine02'
    spine.position.set(0, 2, 0)
    rig.add(hips, spine)

    const weapon = new Object3D()
    const attachment = attachWeapon(character, weapon, SHADOW_WEAPON_TRANSFORM)
    updateShadowWeaponSocket(attachment, null, true, 1)
    character.updateWorldMatrix(true, true)
    const gripBeforeGuard = attachment.socket.getWorldPosition(new Vector3())
    const bladeDirection = new Vector3(...SHADOW_WEAPON_TRANSFORM.bladeDirection)
      .normalize()
      .applyQuaternion(weapon.quaternion)
      .applyQuaternion(attachment.socket.quaternion)
      .setZ(0)
      .normalize()
    hips.position.copy(gripBeforeGuard).addScaledVector(bladeDirection, 30)
    spine.position.copy(gripBeforeGuard).addScaledVector(bladeDirection, 60)
    const guard = findShadowWeaponBodyGuard(character)
    expect(guard.capsules.map(({ id }) => id)).toEqual(['torso'])
    expect(keepShadowWeaponOutsideBody(attachment, guard)).toBe(true)
    character.updateWorldMatrix(true, true)
    const hiltAfterGuard = weapon.localToWorld(new Vector3(...SHADOW_WEAPON_TRANSFORM.gripPoint))
    const expectedPalm = new Vector3(-5.1, 0, 0)

    expect(hiltAfterGuard.distanceTo(expectedPalm)).toBeLessThan(0.00001)
    expect(attachment.socket.quaternion.angleTo(attachment.stableRotation)).toBeGreaterThan(0.01)
    attachment.detach()
  })
})
