import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Group } from 'three'
import { useGameStore } from '../store/gameStore'
import { runtimeParticleRatio, usePerformanceStore } from '../store/performanceStore'

const DUST_COUNT = 150

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

/** Fine floating dust that follows the camera; biome weather lives in WeatherSystem. */
export function DustParticles() {
  const group = useRef<Group>(null)
  const tier = usePerformanceStore((state) => state.tier)
  const qualityFactor = usePerformanceStore((state) => state.qualityFactor)
  const particleRatio = runtimeParticleRatio(tier, qualityFactor)
  const dustPositions = useMemo(() => createParticlePositions(Math.round(DUST_COUNT * particleRatio), 6.8, 2.4), [particleRatio])

  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.position.x = useGameStore.getState().cameraX
    group.current.position.y = Math.sin(clock.elapsedTime * 0.22) * 0.08
    group.current.rotation.z = Math.sin(clock.elapsedTime * 0.06) * 0.01
  })

  return (
    <group ref={group} name="camera-atmosphere">
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#ffe5c8" size={0.032} transparent opacity={0.26} depthWrite={false} blending={AdditiveBlending} sizeAttenuation />
      </points>
      <mesh position={[0, 1.15, -5.5]}>
        <planeGeometry args={[31, 2.4]} />
        <meshBasicMaterial color="#d9d6c5" transparent opacity={0.025} depthWrite={false} />
      </mesh>
    </group>
  )
}
