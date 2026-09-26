import { PMREMGenerator, type Material, type MeshStandardMaterial, type Object3D, type Texture, type WebGLRenderer } from 'three'
import { RoomEnvironment } from 'three-stdlib'

/**
 * The swords are fully metallic. Without something to reflect they render
 * nearly black, so each blade gets a tiny studio environment of its own (not
 * the whole scene: image-based lighting everywhere cost too much on
 * integrated GPUs). One environment per WebGL context.
 */
const environments = new WeakMap<WebGLRenderer, Texture>()

export function swordEnvironment(renderer: WebGLRenderer) {
  const cached = environments.get(renderer)
  if (cached) return cached
  const generator = new PMREMGenerator(renderer)
  const texture = generator.fromScene(RoomEnvironment(), 0.04).texture
  generator.dispose()
  environments.set(renderer, texture)
  return texture
}

/** Gives a blade its own polished materials so one canvas never tints another. */
export function polishBlade(root: Object3D, environment: Texture, lift = 0.2) {
  root.traverse((node) => {
    const mesh = node as Object3D & { isMesh?: boolean; material?: Material | Material[] }
    if (!mesh.isMesh || !mesh.material) return
    const polish = (material: Material) => {
      const copy = material.clone() as MeshStandardMaterial
      if ('envMap' in copy) {
        copy.envMap = environment
        copy.envMapIntensity = 1.7
        copy.roughness = Math.min(copy.roughness ?? 1, 0.5)
        // A cool steel sheen so a thin blade still reads against a dark sky.
        copy.color.multiplyScalar(1 + lift * 1.5)
        copy.emissive.set('#8fa4bd')
        copy.emissiveIntensity = lift
        copy.needsUpdate = true
      }
      return copy
    }
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(polish) : polish(mesh.material)
  })
}
