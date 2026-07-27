import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, Group, PointsMaterial } from 'three'
import { getBiomeBlend } from '../config/biomes'
import { useGameStore } from '../store/gameStore'

const DUST_COUNT = 150
const EMBER_COUNT = 72
const accentTarget = new Color()
const accentNext = new Color()

function createParticlePositions(count: number, verticalRange: number, depthRange: number) {
  const values = new Float32Array(count * 3)
  for (let index = 0; index < count; index += 1) {
    const seed = index * 73.13
    values[index * 3] = Math.sin(seed) * 18
    values[index * 3 + 1] = ((Math.sin(seed * 1.7) + 1) / 2) * verticalRange + 0.35
    values[index * 3 + 2] = Math.cos(seed * 0.83) * depthRange - 1.2
  }
  return values
}

export function DustParticles() {
  const group = useRef<Group>(null)
  const emberMaterial = useRef<PointsMaterial>(null)
  const dustPositions = useMemo(() => createParticlePositions(DUST_COUNT, 6.8, 2.4), [])
  const emberPositions = useMemo(() => createParticlePositions(EMBER_COUNT, 5.4, 1.8), [])

  useFrame(({ clock }, delta) => {
    if (!group.current) return
    const cameraX = useGameStore.getState().cameraX
    const blend = getBiomeBlend(cameraX)
    const smoothing = 1 - Math.exp(-Math.min(delta, 0.1) * 2.4)

    group.current.position.x = cameraX
    group.current.position.y = Math.sin(clock.elapsedTime * 0.22) * 0.08
    group.current.rotation.z = Math.sin(clock.elapsedTime * 0.06) * 0.01
    if (emberMaterial.current) {
      accentTarget.set(blend.from.accentColor)
      accentNext.set(blend.to.accentColor)
      accentTarget.lerp(accentNext, blend.mix)
      emberMaterial.current.color.lerp(accentTarget, smoothing)
    }
  })

  return (
    <group ref={group} name="camera-atmosphere">
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#ffe5c8"
          size={0.032}
          transparent
          opacity={0.26}
          depthWrite={false}
          blending={AdditiveBlending}
          sizeAttenuation
        />
      </points>
      <points rotation={[0, 0, 0.15]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[emberPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={emberMaterial}
          color="#ff286f"
          size={0.052}
          transparent
          opacity={0.44}
          depthWrite={false}
          blending={AdditiveBlending}
          sizeAttenuation
        />
      </points>
      <mesh position={[0, 1.15, -5.5]}>
        <planeGeometry args={[31, 2.4]} />
        <meshBasicMaterial
          color="#d9d6c5"
          transparent
          opacity={0.025}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
