import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Group, MathUtils } from 'three'
import { useSessionStore } from '../store/sessionStore'
import { TimeSpiralDisc } from './TimeSpiralDisc'

const RIFT_POINTS = Array.from({ length: 30 }, (_, index) => index / 30 * Math.PI * 2)
const VORTEX_RINGS = [0.52, 0.88, 1.24, 1.62, 2.02, 2.42] as const

export function FinalPortal() {
  const root = useRef<Group>(null)
  const inner = useRef<Group>(null)
  const corona = useRef<Group>(null)

  useFrame((_, delta) => {
    if (!root.current || !inner.current || !corona.current) return
    const state = useSessionStore.getState()
    const visible = state.phase === 'ending' && ['portal', 'falling', 'continued'].includes(state.bossPhase)
    root.current.visible = visible
    if (!visible) return
    const elapsed = performance.now() - state.bossPhaseStartedAt
    const opening = MathUtils.clamp((elapsed - 1_700) / 1_050, 0, 1)
    const pulse = 1 + Math.sin(elapsed * 0.012) * 0.045
    root.current.position.x = state.endingPortalX
    root.current.scale.setScalar(opening * pulse)
    inner.current.rotation.z += delta * 0.42
    corona.current.rotation.z -= delta * 0.78
  })

  return (
    <group ref={root} visible={false} position={[0, 0.1, 0]} name="aku-hareketli-zaman-portali">
      <group ref={inner} rotation={[Math.PI / 2, 0, 0]}>
        <mesh position={[0, 0, -0.04]}><circleGeometry args={[2.92, 96]} /><meshBasicMaterial color="#010102" transparent opacity={0.96} /></mesh>
        <TimeSpiralDisc radius={2.72} opacity={1} speed={5.8} />
        {VORTEX_RINGS.map((radius, index) => (
          <mesh key={radius} position={[0, 0, 0.035 + index * 0.002]}>
            <torusGeometry args={[radius, index % 2 ? 0.026 : 0.045, 8, 96]} />
            <meshBasicMaterial color={index % 2 ? '#75e9ff' : '#fff0aa'} transparent opacity={0.5} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
        <group ref={corona}>
          <mesh position={[0, 0, 0.08]}><torusGeometry args={[2.84, 0.09, 10, 96]} /><meshBasicMaterial color="#fff4c4" transparent opacity={0.92} blending={AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
          <mesh position={[0, 0, 0.075]}><torusGeometry args={[3.02, 0.035, 7, 96]} /><meshBasicMaterial color="#5be5ff" transparent opacity={0.8} blending={AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
          {RIFT_POINTS.map((angle, index) => {
            const radius = 2.94 + Math.sin(index * 2.1) * 0.14
            return <mesh key={angle} position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0.09]} rotation={[0, 0, angle - Math.PI / 2]}>
              <coneGeometry args={[0.09 + index % 3 * 0.018, 0.52 + index % 5 * 0.08, 4]} />
              <meshBasicMaterial color={index % 2 ? '#69e7ff' : '#fff1a7'} transparent opacity={0.86} toneMapped={false} />
            </mesh>
          })}
        </group>
      </group>
    </group>
  )
}
