import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { useSessionStore } from '../store/sessionStore'
import type { CombatImpactState } from '../types/session'
import { CombatImpactVisual } from './CombatImpactVisual'

function CombatImpact({ impact }: { impact: CombatImpactState }) {
  const root = useRef<Group>(null)
  useFrame((_, delta) => {
    if (!root.current) return
    const progress = Math.min(1, (performance.now() - impact.createdAt) / impact.duration)
    root.current.scale.setScalar((0.35 + progress * (impact.lethal ? 2.3 : 1.45)) * Math.sin(Math.PI * Math.min(1, progress + 0.08)))
    root.current.rotation.y += delta * 3.2
    if (impact.kind !== 'portal') root.current.rotation.z -= delta * 1.7
  })
  return (
    <group ref={root} position={[impact.x, impact.y, 0]}>
      <CombatImpactVisual kind={impact.kind} lethal={impact.lethal} />
    </group>
  )
}

export function CombatImpactEffects() {
  const impacts = useSessionStore((state) => state.impacts)
  return <>{impacts.map((impact) => <CombatImpact impact={impact} key={impact.id} />)}</>
}
