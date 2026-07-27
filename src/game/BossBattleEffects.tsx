import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Group, Mesh } from 'three'
import { useSessionStore } from '../store/sessionStore'
import type { MeteorState } from '../types/session'

const THORNS = Array.from({ length: 18 }, (_, index) => index / 18 * Math.PI * 2)

function MeteorVisual({ meteor }: { meteor: MeteorState }) {
  const root = useRef<Group>(null)
  const orb = useRef<Mesh>(null)
  useFrame(() => {
    if (!root.current || !orb.current) return
    const now = performance.now()
    root.current.visible = now >= meteor.createdAt
    const total = Math.max(1, meteor.impactAt - meteor.createdAt)
    const progress = Math.min(1, Math.max(0, (now - meteor.createdAt) / total))
    const pulse = 0.78 + Math.sin(now * 0.014) * 0.18
    root.current.scale.set(pulse * (0.7 + progress * 0.75), 1, pulse * (0.7 + progress * 0.75))
    const fallProgress = Math.min(1, Math.max(0, (now - meteor.impactAt + 1_100) / 1_100))
    orb.current.visible = fallProgress > 0 && meteor.landedAt === 0
    orb.current.position.y = 9.5 - fallProgress * 9.1
    orb.current.scale.setScalar(0.5 + fallProgress * 0.6)
  })
  return (
    <group ref={root} position={[meteor.x, 0.04, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[0.78, 1.18, 42]} /><meshBasicMaterial color={meteor.kind === 'fire' ? '#ff8b20' : '#ff173f'} transparent opacity={0.48} blending={AdditiveBlending} depthWrite={false} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}><torusGeometry args={[0.98, 0.06, 8, 42]} /><meshBasicMaterial color="#120008" /></mesh>
      <mesh ref={orb}><icosahedronGeometry args={[0.5, 2]} /><meshStandardMaterial color="#050006" emissive={meteor.kind === 'fire' ? '#ff7517' : '#ff0b34'} emissiveIntensity={2.5} roughness={0.2} /></mesh>
    </group>
  )
}

export function BossBattleEffects() {
  const meteors = useSessionStore((state) => state.meteors)
  const boss = useSessionStore((state) => state.enemies.find((enemy) => enemy.bossType === 'shadow' && enemy.animation !== 'dead'))
  const ring = useRef<Group>(null)
  useFrame((_, delta) => {
    if (!ring.current || !boss) return
    ring.current.position.x = boss.x
    ring.current.visible = boss.special === 'meteor'
    ring.current.rotation.y += delta * 0.42
  })
  return (
    <>
      {meteors.map((meteor) => <MeteorVisual meteor={meteor} key={meteor.id} />)}
      <group ref={ring} visible={false}>
        <pointLight color="#ff143c" intensity={7} distance={6} />
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.09, 0]}><torusGeometry args={[2.72, 0.08, 7, 64]} /><meshStandardMaterial color="#190006" emissive="#ff0c31" emissiveIntensity={1.7} /></mesh>
        {THORNS.map((angle) => <mesh key={angle} position={[Math.cos(angle) * 2.72, 0.38, Math.sin(angle) * 2.72]} rotation={[0, -angle, Math.PI / 7]}><coneGeometry args={[0.13, 0.76, 5]} /><meshStandardMaterial color="#210008" emissive="#c7092e" emissiveIntensity={0.8} /></mesh>)}
      </group>
    </>
  )
}
