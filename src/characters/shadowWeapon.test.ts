import { Bone, Group, Object3D, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { SHADOW_WEAPON_TRANSFORM } from '../config/characterTransforms'
import { attachWeapon } from './WeaponSocket'
import { constrainShadowBladeDirection, updateShadowWeaponSocket } from './shadowWeapon'

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
})
