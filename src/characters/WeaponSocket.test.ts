import { Euler, Object3D, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { BOSS_MODEL_SCALES, CHARACTER_TRANSFORMS, SHADOW_WEAPON_TRANSFORM } from '../config/characterTransforms'
import { applyWeaponTransform } from './WeaponSocket'

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

  it('aims Ali\'s long blade head forward while keeping the authored axial roll', () => {
    const transform = CHARACTER_TRANSFORMS.ali
    const longBladeHead = new Vector3(...transform.weapon.bladeDirection)
      .normalize()
      .negate()
      .applyEuler(new Euler(...transform.weapon.rotation))
      .applyEuler(new Euler(...transform.modelRotation))

    expect(longBladeHead.x).toBeGreaterThan(0.999)
    expect(Math.abs(longBladeHead.y)).toBeLessThan(0.001)
    expect(longBladeHead.clone().applyAxisAngle(new Vector3(0, 1, 0), Math.PI).x).toBeLessThan(-0.999)
    expect(transform.weapon).toMatchObject({ alignBlade: false, bladeRoll: Math.PI, rotation: [0, -2.426, 0] })
    expect(CHARACTER_TRANSFORMS.jack.weapon).toMatchObject({ alignBlade: false, rotation: [Math.PI / 2, Math.PI, 0] })
  })

  it('uses a dedicated hand-pose correction and shared boss presentation scales for Aku\'s Shadow', () => {
    expect(SHADOW_WEAPON_TRANSFORM.rotation).not.toEqual(CHARACTER_TRANSFORMS.jack.weapon.rotation)
    expect(BOSS_MODEL_SCALES).toEqual({ shadow: 2.94, aku: 3.83 })
  })
})
