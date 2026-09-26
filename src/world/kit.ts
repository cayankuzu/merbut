import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Euler,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Matrix4,
  OctahedronGeometry,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import { mergeBufferGeometries } from 'three-stdlib'

/**
 * A tiny "set dressing" kit. Biomes place hundreds of primitive parts, each
 * with its own colour, and the kit merges them into one mesh per material so
 * a whole biome costs a handful of draw calls.
 */
export type SurfaceKind = 'stone' | 'metal' | 'wood' | 'glow' | 'gloss' | 'foliage' | 'silhouette' | 'ice'

export interface Placement {
  at?: [number, number, number]
  rotate?: [number, number, number]
  scale?: number | [number, number, number]
  color: string
}

const matrix = new Matrix4()
const quaternion = new Quaternion()
const euler = new Euler()
const position = new Vector3()
const scale = new Vector3()
const tint = new Color()

/** Deterministic pseudo random, so every visit to a biome looks identical. */
export function seeded(seed: number) {
  let value = seed >>> 0
  return () => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0
    return value / 4_294_967_296
  }
}

export class Kit {
  private parts = new Map<SurfaceKind, BufferGeometry[]>()

  add(surface: SurfaceKind, geometry: BufferGeometry, placement: Placement) {
    const part = geometry.index ? geometry.toNonIndexed() : geometry.clone()
    geometry.dispose()
    const [sx, sy, sz] = typeof placement.scale === 'number' ? [placement.scale, placement.scale, placement.scale] : placement.scale ?? [1, 1, 1]
    position.set(...(placement.at ?? [0, 0, 0]))
    quaternion.setFromEuler(euler.set(...(placement.rotate ?? [0, 0, 0])))
    scale.set(sx, sy, sz)
    part.applyMatrix4(matrix.compose(position, quaternion, scale))
    tint.set(placement.color)
    const count = part.getAttribute('position').count
    const colors = new Float32Array(count * 3)
    for (let index = 0; index < count; index += 1) {
      colors[index * 3] = tint.r
      colors[index * 3 + 1] = tint.g
      colors[index * 3 + 2] = tint.b
    }
    part.setAttribute('color', new Float32BufferAttribute(colors, 3))
    if (!part.getAttribute('uv')) part.setAttribute('uv', new Float32BufferAttribute(new Float32Array(count * 2), 2))
    const list = this.parts.get(surface) ?? []
    list.push(part)
    this.parts.set(surface, list)
    return this
  }

  box(surface: SurfaceKind, size: [number, number, number], placement: Placement) {
    return this.add(surface, new BoxGeometry(...size), placement)
  }

  cylinder(surface: SurfaceKind, top: number, bottom: number, height: number, placement: Placement, sides = 8) {
    return this.add(surface, new CylinderGeometry(top, bottom, height, sides), placement)
  }

  cone(surface: SurfaceKind, radius: number, height: number, placement: Placement, sides = 6) {
    return this.add(surface, new ConeGeometry(radius, height, sides), placement)
  }

  rock(surface: SurfaceKind, radius: number, placement: Placement, detail = 0) {
    return this.add(surface, detail > 0 ? new IcosahedronGeometry(radius, detail) : new DodecahedronGeometry(radius, 0), placement)
  }

  sphere(surface: SurfaceKind, radius: number, placement: Placement, segments = 10) {
    return this.add(surface, new SphereGeometry(radius, segments, Math.max(6, segments - 2)), placement)
  }

  gem(surface: SurfaceKind, radius: number, placement: Placement) {
    return this.add(surface, new OctahedronGeometry(radius, 0), placement)
  }

  torus(surface: SurfaceKind, radius: number, tube: number, placement: Placement, arc = Math.PI * 2, segments = 24) {
    return this.add(surface, new TorusGeometry(radius, tube, 6, segments, arc), placement)
  }

  plane(surface: SurfaceKind, width: number, height: number, placement: Placement) {
    return this.add(surface, new PlaneGeometry(width, height), placement)
  }

  /** A smooth tube through points: vines, cables, chains, ropes, roots. */
  tube(surface: SurfaceKind, points: [number, number, number][], radius: number, placement: Omit<Placement, 'at' | 'rotate' | 'scale'>, segments = 24) {
    const curve = new CatmullRomCurve3(points.map((point) => new Vector3(...point)))
    return this.add(surface, new TubeGeometry(curve, segments, radius, 5, false), placement)
  }

  build() {
    const merged = new Map<SurfaceKind, BufferGeometry>()
    this.parts.forEach((parts, surface) => {
      const geometry = mergeBufferGeometries(parts, false)
      parts.forEach((part) => part.dispose())
      if (!geometry) return
      geometry.computeBoundingSphere()
      merged.set(surface, geometry)
    })
    this.parts.clear()
    return merged
  }
}
