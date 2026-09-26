import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { createShellMaterial } from './shellMaterial'

/** Replaces the old wireframe spheres on Jack's guard, Aku's dark orbs and Ali's fireball. */
export function EnergyShell({ color, core = '#ffffff', opacity = 1, radius = 1, bands = 9, speed = 1, fill = 0 }: {
  color: string
  core?: string
  opacity?: number
  radius?: number
  bands?: number
  speed?: number
  fill?: number
}) {
  const material = useMemo(() => createShellMaterial({ color, core, opacity, bands, fill }), [bands, color, core, fill, opacity])
  useEffect(() => () => material.dispose(), [material])
  useFrame((_, delta) => {
    material.uniforms.uTime!.value += Math.min(delta, 0.1) * speed
  })
  return (
    <mesh material={material} renderOrder={12}>
      <sphereGeometry args={[radius, 32, 20]} />
    </mesh>
  )
}
