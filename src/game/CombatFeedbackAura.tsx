import { AdditiveBlending, DoubleSide, MeshBasicMaterial, PlaneGeometry, RingGeometry } from 'three'
import { COMBAT_EFFECT_STYLE } from './combatEffectConfig'
import type { CombatImpactState, ImpactKind } from '../types/session'

interface CombatFeedbackAuraProps {
  impact: CombatImpactState
  detail: boolean
}

const IMPACT_KINDS = Object.keys(COMBAT_EFFECT_STYLE) as ImpactKind[]
const AURA_RING_GEOMETRY = new RingGeometry(0.42, 0.52, 28)
const LETHAL_AURA_RING_GEOMETRY = new RingGeometry(0.42, 0.57, 28)
const AURA_STREAK_GEOMETRY = new PlaneGeometry(1.12, 0.06)
const AURA_MATERIALS = Object.fromEntries(IMPACT_KINDS.map((kind) => [kind, {
  normal: new MeshBasicMaterial({
    blending: AdditiveBlending,
    color: COMBAT_EFFECT_STYLE[kind].primary,
    depthWrite: false,
    opacity: 0.5,
    side: DoubleSide,
    toneMapped: false,
    transparent: true,
  }),
  lethal: new MeshBasicMaterial({
    blending: AdditiveBlending,
    color: COMBAT_EFFECT_STYLE[kind].primary,
    depthWrite: false,
    opacity: 0.78,
    side: DoubleSide,
    toneMapped: false,
    transparent: true,
  }),
  streak: new MeshBasicMaterial({
    blending: AdditiveBlending,
    color: COMBAT_EFFECT_STYLE[kind].secondary,
    depthWrite: false,
    opacity: 0.62,
    side: DoubleSide,
    toneMapped: false,
    transparent: true,
  }),
}])) as Record<ImpactKind, { normal: MeshBasicMaterial; lethal: MeshBasicMaterial; streak: MeshBasicMaterial }>

/**
 * A readable, ground-anchored answer to a hit. The existing impact mesh keeps
 * the particle language; this layer gives players an immediate expanding
 * contact ring. Detail is disabled on the lower adaptive tiers.
 */
export function CombatFeedbackAura({ impact, detail }: CombatFeedbackAuraProps) {
  const materials = AURA_MATERIALS[impact.kind]

  return (
    <>
      <mesh
        geometry={impact.lethal ? LETHAL_AURA_RING_GEOMETRY : AURA_RING_GEOMETRY}
        material={impact.lethal ? materials.lethal : materials.normal}
        position={[0, -impact.y + 0.045, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={impact.lethal ? 1.25 : 1}
        dispose={null}
      />
      {detail ? (
        <mesh
          geometry={AURA_STREAK_GEOMETRY}
          material={materials.streak}
          position={[0, 0.12, -0.06]}
          rotation={[0, 0, Math.PI / 4]}
          scale={impact.lethal ? [1.3, 1.3, 1] : [1, 1, 1]}
          dispose={null}
        />
      ) : null}
    </>
  )
}
