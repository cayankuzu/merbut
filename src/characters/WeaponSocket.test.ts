import { Object3D, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { CHARACTER_TRANSFORMS } from '../config/characterTransforms'
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

  it('uses direct local orientation for the inverted Ali blade and the rolled Jack katana', () => {
    expect(CHARACTER_TRANSFORMS.ali.weapon).toMatchObject({ alignBlade: false, bladeRoll: Math.PI, rotation: [-Math.PI / 2, 0, Math.PI / 2] })
    expect(CHARACTER_TRANSFORMS.jack.weapon).toMatchObject({ alignBlade: false, rotation: [Math.PI / 2, Math.PI, 0] })
  })
})
