import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, DoubleSide, MeshBasicMaterial } from 'three'
import { COMBAT_EFFECT_STYLE } from './combatEffectConfig'
import type { CombatImpactState } from '../types/session'

interface CombatFeedbackAuraProps {
  impact: CombatImpactState
  detail: boolean
}

/**
 * A readable, ground-anchored answer to a hit. The existing impact mesh keeps
 * the particle language; this layer gives players an immediate expanding
 * contact ring. Detail is disabled on the lower adaptive tiers.
 */
export function CombatFeedbackAura({ impact, detail }: CombatFeedbackAuraProps) {
  const ringMaterial = useRef<MeshBasicMaterial>(null)
  const flareMaterial = useRef<MeshBasicMaterial>(null)
  const style = COMBAT_EFFECT_STYLE[impact.kind]

  useFrame(() => {
    const progress = Math.min(1, Math.max(0, (performance.now() - impact.createdAt) / impact.duration))
    if (ringMaterial.current) ringMaterial.current.opacity = (1 - progress) * (impact.lethal ? 0.78 : 0.5)
    if (flareMaterial.current) flareMaterial.current.opacity = Math.max(0, 1 - progress * 1.5) * 0.62
  })

  return (
    <>
      <mesh position={[0, -impact.y + 0.045, 0]} rotation={[Math.PI / 2, 0, 0]} scale={impact.lethal ? 1.25 : 1}>
        <ringGeometry args={[0.42, impact.lethal ? 0.57 : 0.52, 28]} />
        <meshBasicMaterial ref={ringMaterial} color={style.primary} transparent opacity={0} side={DoubleSide} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </mesh>
      {detail ? (
        <mesh position={[0, 0.12, -0.06]} rotation={[0, 0, Math.PI / 4]} scale={impact.lethal ? [1.3, 1.3, 1] : [1, 1, 1]}>
          <planeGeometry args={[1.12, 0.06]} />
          <meshBasicMaterial ref={flareMaterial} color={style.secondary} transparent opacity={0} side={DoubleSide} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
        </mesh>
      ) : null}
    </>
  )
}
