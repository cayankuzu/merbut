import { Bone, Euler, Group, Object3D, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { BOSS_MODEL_SCALES, CHARACTER_TRANSFORMS, SHADOW_WEAPON_TRANSFORM } from '../config/characterTransforms'
import { applyWeaponTransform, attachWeapon, keepWeaponOutsideTorso, placeWeaponGripInPalm, updateWeaponSocket } from './WeaponSocket'

function transformedGrip(id: 'ali' | 'jack') {
  const weapon = new Object3D()
  const transform = CHARACTER_TRANSFORMS[id].weapon
  applyWeaponTransform(weapon, transform)
    return new Vector3(...transform.gripPoint)
    .multiply(weapon.scale)
    .applyQuaternion(weapon.quaternion)
    .add(weapon.position)
}

describe('weapon transforms', () => {
  it('keeps both authored grip positions fixed while rotating each blade body', () => {
    expect(transformedGrip('ali').distanceTo(new Vector3(...CHARACTER_TRANSFORMS.ali.weapon.position))).toBeLessThan(0.00001)
    expect(transformedGrip('jack').distanceTo(new Vector3(...CHARACTER_TRANSFORMS.jack.weapon.position))).toBeLessThan(0.00001)
  })

  it('uses Ali\'s calibrated two-axis blade pose without moving the grip', () => {
    const transform = CHARACTER_TRANSFORMS.ali.weapon

    expect(transform).toMatchObject({
      alignBlade: false,
      rotation: [-1.790930078, 0.545735745, -1.712078786],
    })
    expect(transform.bladeRoll).toBeUndefined()
    expect(transformedGrip('ali').distanceTo(new Vector3(...transform.position))).toBeLessThan(0.00001)
    expect(CHARACTER_TRANSFORMS.jack.weapon).toMatchObject({ alignBlade: true, rotation: [Math.PI / 2, Math.PI, 0] })
  })

  it('aims Jack\'s blade toward the enemy below the torso without moving the grip', () => {
    const character = new Group()
    const armature = new Bone()
    const hand = new Bone()
    hand.name = 'RightHand'
    armature.add(hand)
    character.add(armature)
    const sword = new Object3D()
    const transform = CHARACTER_TRANSFORMS.jack
    const attachment = attachWeapon(character, sword, transform.weapon)

    const characterBladeDirection = new Vector3(...transform.weapon.bladeDirection)
      .normalize()
      .applyQuaternion(sword.quaternion)
      .applyQuaternion(attachment.socket.quaternion)
    const worldBladeDirection = characterBladeDirection
      .clone()
      .applyEuler(new Euler(...transform.modelRotation))

    expect(worldBladeDirection.x).toBeGreaterThan(0.5)
    expect(worldBladeDirection.y).toBeLessThan(-0.7)
    expect(Math.abs(worldBladeDirection.z)).toBeLessThan(0.001)
    expect(transformedGrip('jack').distanceTo(new Vector3(...transform.weapon.position))).toBeLessThan(0.00001)
  })

  it('keeps Jack\'s katana attached to the animated right-hand rotation', () => {
    const character = new Group()
    const armature = new Bone()
    const hand = new Bone()
    hand.name = 'RightHand'
    armature.add(hand)
    character.add(armature)
    const attachment = attachWeapon(character, new Object3D(), CHARACTER_TRANSFORMS.jack.weapon)
    const before = attachment.socket.quaternion.clone()

    hand.rotation.z = 0.45
    character.updateWorldMatrix(true, true)
    updateWeaponSocket(attachment, true, 1)

    expect(attachment.socket.quaternion.angleTo(before)).toBeGreaterThan(0.25)
  })

  it('moves Ali\'s fixed grip from the wrist into the palm without rotating the blade', () => {
    const character = new Group()
    const rig = new Bone()
    const forearm = new Bone()
    const hand = new Bone()
    hand.name = 'RightHand'
    hand.position.set(0, 10, 0)
    forearm.add(hand)
    rig.add(forearm)
    character.add(rig)
    const weapon = new Object3D()
    const attachment = attachWeapon(character, weapon, CHARACTER_TRANSFORMS.ali.weapon)
    const bladeRotation = weapon.quaternion.clone()

    expect(placeWeaponGripInPalm(attachment, 0.42)).toBe(true)
    character.updateWorldMatrix(true, true)
    const grip = weapon.localToWorld(new Vector3(...CHARACTER_TRANSFORMS.ali.weapon.gripPoint))

    expect(grip.distanceTo(new Vector3(0, 14.2, 0))).toBeLessThan(0.00001)
    expect(weapon.quaternion.angleTo(bladeRotation)).toBeLessThan(0.00001)
  })

  it('turns a torso-crossing blade around its fixed grip', () => {
    const character = new Group()
    const rig = new Bone()
    const hand = new Bone()
    const torso = new Bone()
    hand.name = 'RightHand'
    hand.position.x = -0.5
    torso.name = 'Spine02'
    rig.add(hand, torso)
    character.add(rig)
    const weapon = new Object3D()
    const transform = {
      alignBlade: false,
      bladeDirection: [1, 0, 0] as [number, number, number],
      gripPoint: [0, 0, 0] as [number, number, number],
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      scale: [1, 1, 1] as [number, number, number],
    }
    const attachment = attachWeapon(character, weapon, transform)
    keepWeaponOutsideTorso(attachment, torso, transform, 2, 0.25)
    character.updateWorldMatrix(true, true)

    const direction = new Vector3(1, 0, 0)
      .applyQuaternion(weapon.quaternion)
      .applyQuaternion(attachment.socket.quaternion)
    const hilt = weapon.localToWorld(new Vector3())
    const gripToTorso = torso.getWorldPosition(new Vector3())
      .sub(attachment.socket.getWorldPosition(new Vector3()))
      .setZ(0)
    const closestPoint = direction.clone().multiplyScalar(Math.max(0, Math.min(2, gripToTorso.dot(direction))))
    const closestDistance = gripToTorso.sub(closestPoint).length()

    expect(Math.abs(direction.y)).toBeGreaterThan(0.05)
    expect(closestDistance).toBeCloseTo(0.25, 5)
    expect(hilt.distanceTo(attachment.socket.getWorldPosition(new Vector3()))).toBeLessThan(0.00001)
  })

  it('uses a dedicated hand-pose correction and shared boss presentation scales for Aku\'s Shadow', () => {
    expect(SHADOW_WEAPON_TRANSFORM.alignBlade).toBe(false)
    expect(SHADOW_WEAPON_TRANSFORM.rotation).not.toEqual(CHARACTER_TRANSFORMS.jack.weapon.rotation)
    expect(BOSS_MODEL_SCALES).toEqual({ shadow: 2.94, aku: 3.83 })
  })
})
