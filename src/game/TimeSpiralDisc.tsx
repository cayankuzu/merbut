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

  void main() {
    vec2 point = (vUv - 0.5) * 2.0;
    float radius = length(point);
    float angle = atan(point.y, point.x);
    float wave = 0.5 + 0.5 * sin(radius * 48.0 - angle * 4.0 - uTime * uSpeed);
    float bands = smoothstep(0.42, 0.58, wave);
    float centerPulse = 0.5 + 0.5 * sin(radius * 72.0 + uTime * uSpeed * 1.35);
    bands = mix(bands, smoothstep(0.46, 0.54, centerPulse), smoothstep(0.38, 0.0, radius));
    float edge = 1.0 - smoothstep(0.93, 1.0, radius);
    vec3 color = mix(uDark, uLight, bands);
    gl_FragColor = vec4(color, edge * uOpacity);
  }
`

export function TimeSpiralDisc({
  radius = 1,
  opacity = 1,
  speed = 4.5,
  lightColor = '#fffdf5',
  darkColor = '#020103',
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
