import { AdditiveBlending } from 'three'
import type { ImpactKind } from '../types/session'
import { COMBAT_EFFECT_STYLE } from './combatEffectConfig'
import { TimeSpiralDisc } from './TimeSpiralDisc'

export function CombatImpactVisual({ kind, lethal = false }: { kind: ImpactKind; lethal?: boolean }) {
  const style = COMBAT_EFFECT_STYLE[kind]
  return (
    <>
      <pointLight color={style.secondary} intensity={lethal ? 11 : 6} distance={4} />
      {kind === 'portal' ? (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <TimeSpiralDisc radius={0.86} opacity={0.96} speed={8.2} />
          <mesh position={[0, 0, 0.025]}><torusGeometry args={[0.91, 0.055, 8, 56]} /><meshBasicMaterial color="#70e8ff" transparent opacity={0.82} blending={AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
        </group>
      ) : style.shape === 'ring' ? (
        <><mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.72, 0.06, 6, 32]} /><meshBasicMaterial color={style.primary} transparent opacity={0.82} blending={AdditiveBlending} depthWrite={false} /></mesh><mesh><sphereGeometry args={[0.34, 12, 8]} /><meshBasicMaterial color={style.secondary} wireframe transparent opacity={0.45} /></mesh></>
      ) : Array.from({ length: style.shape === 'shard' ? 8 : 11 }, (_, index) => {
        const angle = index / (style.shape === 'shard' ? 8 : 11) * Math.PI * 2
        return <mesh key={angle} position={[Math.cos(angle) * 0.55, Math.sin(angle * 2) * 0.35 + 0.3, Math.sin(angle) * 0.42]} rotation={[angle, angle * 0.7, -angle]}>
          {style.shape === 'shard' ? <tetrahedronGeometry args={[0.23, 0]} /> : <octahedronGeometry args={[0.13, 0]} />}
          <meshBasicMaterial color={index % 2 ? style.primary : style.secondary} toneMapped={false} />
        </mesh>
      })}
    </>
  )
}
