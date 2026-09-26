import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { useSessionStore } from '../store/sessionStore'
import type { CharacterId } from '../types/character'
import { TimeSpiralDisc } from './TimeSpiralDisc'
import { simClock } from '../sim/clock'

interface TimeFreezeAuraProps {
  id: CharacterId
}

export function TimeFreezeAura({ id }: TimeFreezeAuraProps) {
  const root = useRef<Group>(null)

  useFrame((_, delta) => {
    if (!root.current) return
    const active = useSessionStore.getState().players[id].frozenUntil > simClock.now()
    root.current.visible = active
    if (!active) return
    root.current.rotation.z += delta * (id === 'ali' ? 2.2 : -2.2)
    const pulse = 1 + Math.sin(performance.now() * 0.012) * 0.08
    root.current.scale.setScalar(pulse)
  })

  return (
    <group ref={root} visible={false} position={[0, 1.35, 0.72]} name={`${id}-zaman-donmasi`}>
      <TimeSpiralDisc radius={0.82} opacity={0.92} speed={7.2} />
      <mesh position={[0, 0, -0.035]}><torusGeometry args={[0.9, 0.055, 8, 64]} /><meshBasicMaterial color="#70eaff" toneMapped={false} /></mesh>
    </group>
  )
}
