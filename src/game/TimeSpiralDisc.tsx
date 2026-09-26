import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, DoubleSide, ShaderMaterial } from 'three'

interface TimeSpiralDiscProps {
  radius?: number
  opacity?: number
  speed?: number
  lightColor?: string
  darkColor?: string
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSpeed;
  uniform vec3 uLight;
  uniform vec3 uDark;
  varying vec2 vUv;

  // A time vortex: arms of violet and cyan light wind into a dark, star-flecked eye.
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec2 point = (vUv - 0.5) * 2.0;
    float radius = length(point);
    float angle = atan(point.y, point.x);
    float time = uTime * uSpeed * 0.18;
    float twist = angle * 3.0 + log(max(radius, 0.02)) * 5.5 + time * 3.0;
    float arms = pow(0.5 + 0.5 * sin(twist), 3.0);
    float fine = 0.5 + 0.5 * sin(twist * 3.0 - time * 5.0 + radius * 18.0);
    float falloff = smoothstep(1.0, 0.25, radius);
    vec3 violet = vec3(0.56, 0.36, 1.0);
    vec3 cyan = vec3(0.44, 0.91, 1.0);
    vec3 tint = mix(violet, cyan, 0.5 + 0.5 * sin(angle * 2.0 + time));
    vec3 color = uDark + tint * arms * (0.55 + 0.45 * fine) * falloff * 1.6;
    // a white-gold ring where the arms fall into the eye
    float eyeRing = exp(-pow((radius - 0.22) * 14.0, 2.0));
    color += uLight * eyeRing * (0.7 + 0.3 * sin(time * 6.0));
    // stars drifting in the dark centre
    vec2 cell = floor((point + vec2(time * 0.05, 0.0)) * 34.0);
    float star = step(0.985, hash(cell)) * smoothstep(0.24, 0.0, radius);
    color += vec3(star);
    float edge = 1.0 - smoothstep(0.9, 1.0, radius);
    float rim = exp(-pow((radius - 0.93) * 18.0, 2.0));
    color += cyan * rim * 0.9;
    gl_FragColor = vec4(color, edge * uOpacity);
  }
`

export function TimeSpiralDisc({
  radius = 1,
  opacity = 1,
  speed = 4.5,
  lightColor = '#fff1c4',
  darkColor = '#05020f',
}: TimeSpiralDiscProps) {
  const material = useRef<ShaderMaterial>(null)
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: opacity },
    uSpeed: { value: speed },
    uLight: { value: new Color(lightColor) },
    uDark: { value: new Color(darkColor) },
  }), [darkColor, lightColor, opacity, speed])

  useFrame(({ clock }) => {
    if (material.current) material.current.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <mesh>
      <circleGeometry args={[radius, 96]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={DoubleSide}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}
