import { Box3, Matrix4, Vector3, type Mesh, type Object3D } from 'three'
import type { CharacterId, WeaponTransform } from '../../types/character'

/** A hero in the game world, or the same hero on the menu's showcase stage. */
export type BladeKey = CharacterId | `showcase-${CharacterId}`

/**
 * Where each hero's blade is, so the sword trail can follow the real steel
 * instead of a canned arc. Endpoints live in the weapon's local space and are
 * turned into world positions on demand.
 */
export interface BladeEntry {
  weapon: Object3D
  /** The hip bone, where a sheathed katana hangs. */
  hips: Object3D | null
  base: Vector3
  tip: Vector3
}

const blades = new Map<BladeKey, BladeEntry>()
const inverse = new Matrix4()
const relative = new Matrix4()
const box = new Box3()
const corner = new Vector3()

/** Measures the blade: from the grip, how far the steel reaches along its axis. */
export function measureBlade(weapon: Object3D, transform: WeaponTransform): { base: Vector3; tip: Vector3 } {
  const axis = new Vector3(...transform.bladeDirection).normalize()
  const grip = new Vector3(...transform.gripPoint)
  weapon.updateWorldMatrix(true, true)
  inverse.copy(weapon.matrixWorld).invert()
  let reach = 0
  weapon.traverse((node) => {
    const mesh = node as Mesh
    if (!mesh.isMesh || !mesh.geometry) return
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    relative.multiplyMatrices(inverse, mesh.matrixWorld)
    box.copy(mesh.geometry.boundingBox!)
    for (let index = 0; index < 8; index += 1) {
      corner.set(index & 1 ? box.max.x : box.min.x, index & 2 ? box.max.y : box.min.y, index & 4 ? box.max.z : box.min.z).applyMatrix4(relative)
      // `relative` maps mesh space into the weapon's own (untransformed) frame,
      // the same frame the grip point and blade axis are authored in.
      reach = Math.max(reach, corner.clone().sub(grip).dot(axis))
    }
  })
  const length = reach > 0 ? reach : 1
  return {
    base: grip.clone().addScaledVector(axis, length * 0.22),
    tip: grip.clone().addScaledVector(axis, length * 0.98),
  }
}

export function registerBlade(id: BladeKey, entry: BladeEntry) {
  blades.set(id, entry)
  return () => {
    if (blades.get(id) === entry) blades.delete(id)
  }
}

export const bladeEntry = (id: BladeKey) => blades.get(id)

/** Writes the blade's current world endpoints; false when the hero has no blade mounted. */
export function bladeWorld(id: BladeKey, base: Vector3, tip: Vector3) {
  const entry = blades.get(id)
  if (!entry || !entry.weapon.parent) return false
  entry.weapon.updateWorldMatrix(true, false)
  base.copy(entry.base).applyMatrix4(entry.weapon.matrixWorld)
  tip.copy(entry.tip).applyMatrix4(entry.weapon.matrixWorld)
  return true
}
