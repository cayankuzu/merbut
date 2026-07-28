import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { useSessionStore } from '../store/sessionStore'
import type { CombatImpactState } from '../types/session'
import { CombatImpactVisual } from './CombatImpactVisual'
import { CombatFeedbackAura } from './CombatFeedbackAura'
import { PERFORMANCE_PROFILES, usePerformanceStore } from '../store/performanceStore'

function CombatImpact({ impact, detail }: { impact: CombatImpactState; detail: boolean }) {
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
      <CombatFeedbackAura impact={impact} detail={detail || impact.lethal || impact.kind === 'portal'} />
    </group>
  )
}

export function CombatImpactEffects() {
  const impacts = useSessionStore((state) => state.impacts)
  const tier = usePerformanceStore((state) => state.tier)
  const detail = PERFORMANCE_PROFILES[tier].particleRatio >= 0.36
  return <>{impacts.map((impact) => <CombatImpact impact={impact} detail={detail} key={impact.id} />)}</>
}
