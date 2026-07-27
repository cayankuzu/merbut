import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Group } from 'three'
import type { CharacterId } from '../types/character'

export function PrayerHalo({ active, id }: { active: boolean; id: CharacterId }) {
  const root = useRef<Group>(null)
  useFrame(({ clock }, delta) => {
    if (!root.current) return
    root.current.visible = active
    if (!active) return
    root.current.rotation.z += delta * (id === 'jack' ? 0.72 : -0.72)
    const pulse = 1 + Math.sin(clock.elapsedTime * 3.6 + (id === 'jack' ? 0 : 1.2)) * 0.07
    root.current.scale.setScalar(pulse)
  })
  return (
    <group ref={root} visible={active} position={[0, 2.95, 0]} rotation={[Math.PI / 2, 0, 0]} name={`${id}-dua-halkasi`}>
      <pointLight color="#fff3a5" intensity={5} distance={4} />
      <mesh><torusGeometry args={[0.48, 0.055, 8, 48]} /><meshBasicMaterial color="#fff6bd" transparent opacity={0.9} blending={AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
      <mesh scale={1.24}><torusGeometry args={[0.48, 0.018, 6, 48]} /><meshBasicMaterial color={id === 'ali' ? '#ffbf60' : '#8ceeff'} transparent opacity={0.72} blending={AdditiveBlending} depthWrite={false} /></mesh>
    </group>
  )
}
