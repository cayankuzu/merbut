import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide, Group, MeshBasicMaterial, RingGeometry } from 'three'
import { useSessionStore } from '../store/sessionStore'
import type { CombatImpactState } from '../types/session'
import { CombatImpactVisual } from './CombatImpactVisual'
import { COMBAT_EFFECT_STYLE } from './combatEffectConfig'
import { simClock } from '../sim/clock'
import { emitImpactParticles } from './vfx/impactParticles'
import { LIGHT_BLENDING } from './vfx/lightBlending'

const SHOCKWAVE = new RingGeometry(0.86, 1, 48)

/** A thin ground shockwave: the readable "it landed here" for every impact. */
function Shockwave({ impact }: { impact: CombatImpactState }) {
  const ring = useRef<Group>(null)
  const material = useMemo(() => new MeshBasicMaterial({ color: COMBAT_EFFECT_STYLE[impact.kind].primary, transparent: true, opacity: 0.8, depthWrite: false, ...LIGHT_BLENDING, side: DoubleSide, toneMapped: false }), [impact.kind])
  useEffect(() => () => material.dispose(), [material])
  useFrame(() => {
    if (!ring.current) return
    const progress = Math.min(1, (simClock.now() - impact.createdAt) / Math.min(impact.duration, 700))
    const eased = 1 - (1 - progress) * (1 - progress)
    ring.current.scale.setScalar(0.3 + eased * (impact.lethal ? 3.2 : 2.2))
    material.opacity = (1 - progress) * 0.85
  })
  return (
    <group ref={ring} position={[impact.x, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={SHOCKWAVE} material={material} dispose={null} />
    </group>
  )
}

function PortalImpact({ impact }: { impact: CombatImpactState }) {
  const root = useRef<Group>(null)
  useFrame((_, delta) => {
    if (!root.current) return
    const progress = Math.min(1, (simClock.now() - impact.createdAt) / impact.duration)
    root.current.scale.setScalar((0.35 + progress * (impact.lethal ? 2.3 : 1.45)) * Math.sin(Math.PI * Math.min(1, progress + 0.08)))
    root.current.rotation.y += delta * 3.2
  })
  return <group ref={root} position={[impact.x, impact.y, 0]}><CombatImpactVisual kind="portal" lethal={impact.lethal} /></group>
}

function CombatImpact({ impact }: { impact: CombatImpactState }) {
  useEffect(() => emitImpactParticles(impact.kind, impact.x, impact.y, impact.lethal), [impact])
  if (impact.kind === 'portal') return <PortalImpact impact={impact} />
  return <Shockwave impact={impact} />
}

export function CombatImpactEffects() {
  const impacts = useSessionStore((state) => state.impacts)
  return <>{impacts.map((impact) => <CombatImpact impact={impact} key={impact.id} />)}</>
}

