import { Color, DoubleSide, Mesh, PlaneGeometry, ShaderMaterial } from 'three'
import { LIGHT_BLENDING } from './lightBlending'

/** Anime cut lines: a white slash drawn across the target for a few frames. */
const SLASH_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const SLASH_FRAGMENT = /* glsl */ `
  uniform float uLife;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float along = 1.0 - abs(vUv.x * 2.0 - 1.0);
    float across = 1.0 - abs(vUv.y * 2.0 - 1.0);
    float core = pow(across, 3.0) * pow(along, 0.6);
    float alpha = core * uLife;
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), across * across), alpha);
  }
`
const SLASH_MS = 150

interface Slash { mesh: Mesh<PlaneGeometry, ShaderMaterial>; born: number; length: number; ms: number }

export class SlashMarks {
  readonly meshes: Mesh<PlaneGeometry, ShaderMaterial>[]
  private readonly entries: Slash[]
  private readonly geometry = new PlaneGeometry(1, 1)
  private index = 0

  constructor(size: number) {
    this.entries = Array.from({ length: size }, (): Slash => {
      const material = new ShaderMaterial({
        uniforms: { uLife: { value: 0 }, uColor: { value: new Color('#ffffff') } },
        vertexShader: SLASH_VERTEX,
        fragmentShader: SLASH_FRAGMENT,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        ...LIGHT_BLENDING,
        side: DoubleSide,
        toneMapped: false,
      })
      const mesh = new Mesh(this.geometry, material)
      mesh.visible = false
      mesh.frustumCulled = false
      mesh.renderOrder = 14
      return { mesh, born: -Infinity, length: 1, ms: SLASH_MS }
    })
    this.meshes = this.entries.map((entry) => entry.mesh)
  }

  /** `angle` overrides the random cut direction (radians around the view axis). */
  spawn(x: number, y: number, direction: 1 | -1, length: number, color: string, options: { z?: number; angle?: number; ms?: number } = {}) {
    const entry = this.entries[this.index]!
    this.index = (this.index + 1) % this.entries.length
    entry.born = performance.now()
    entry.length = length
    entry.ms = options.ms ?? SLASH_MS
    entry.mesh.position.set(x, y, options.z ?? 0.9)
    entry.mesh.rotation.set(0, 0, options.angle ?? direction * (0.45 + Math.random() * 0.5) * (Math.random() > 0.5 ? 1 : -1))
    ;(entry.mesh.material.uniforms.uColor!.value as Color).set(color)
    entry.mesh.visible = true
  }

  update(now = performance.now()) {
    for (const entry of this.entries) {
      if (!entry.mesh.visible) continue
      const t = (now - entry.born) / entry.ms
      if (t >= 1) {
        entry.mesh.visible = false
        continue
      }
      // shoots out to full length, then thins as it fades
      const grow = Math.min(1, t / 0.25)
      entry.mesh.scale.set(entry.length * (0.35 + grow * 0.65), 0.09 * (1 - t * 0.7), 1)
      entry.mesh.material.uniforms.uLife!.value = 1 - t * t
    }
  }

  dispose() {
    this.geometry.dispose()
    this.entries.forEach((entry) => entry.mesh.material.dispose())
  }
}
