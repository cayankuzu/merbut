import { Color, ShaderMaterial } from 'three'
import { LIGHT_BLENDING } from './lightBlending'

/**
 * A soft energy shell: bright at the rim (fresnel), almost clear in the
 * middle, with slow bands of light rolling over it. Works on plain and
 * instanced meshes; advance `uTime` to animate it.
 */
const VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPosition;
  void main() {
    vec4 local = vec4(position, 1.0);
    vec3 objectNormal = normal;
    #ifdef USE_INSTANCING
      local = instanceMatrix * local;
      objectNormal = mat3(instanceMatrix) * objectNormal;
    #endif
    vec4 view = modelViewMatrix * local;
    vNormal = normalize(normalMatrix * objectNormal);
    vView = isOrthographic ? vec3(0.0, 0.0, 1.0) : normalize(-view.xyz);
    vPosition = position;
    gl_Position = projectionMatrix * view;
  }
`
const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uCore;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uBands;
  uniform float uFill;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPosition;
  void main() {
    float facing = abs(dot(normalize(vNormal), vView));
    float rim = pow(1.0 - facing, 2.4);
    float bands = 0.5 + 0.5 * sin(vPosition.y * uBands - uTime * 4.2);
    float flicker = 0.5 + 0.5 * sin(uTime * 11.0 + vPosition.x * 7.0);
    // uFill > 0 turns the shell into a glowing orb: hot centre, softer rim.
    float body = uFill * pow(facing, 1.6);
    float alpha = (rim * 0.9 + rim * bands * 0.35 + 0.035 + flicker * 0.02 + body) * uOpacity;
    vec3 color = mix(uColor, uCore, clamp(rim * rim + body, 0.0, 1.0));
    gl_FragColor = vec4(color * (0.9 + rim * 1.4 + body), alpha);
  }
`

export interface ShellOptions {
  color: string
  core?: string
  opacity?: number
  bands?: number
  /** 0 = hollow bubble (a guard), 1 = glowing orb (a fireball). */
  fill?: number
}

export function createShellMaterial({ color, core = '#ffffff', opacity = 1, bands = 9, fill = 0 }: ShellOptions) {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(color) },
      uCore: { value: new Color(core) },
      uOpacity: { value: opacity },
      uTime: { value: Math.random() * 10 },
      uBands: { value: bands },
      uFill: { value: fill },
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    ...LIGHT_BLENDING,
    toneMapped: false,
  })
}
