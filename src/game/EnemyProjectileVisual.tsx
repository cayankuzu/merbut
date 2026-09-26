import type { EnemyProjectileState } from '../types/session'
import { TimeSpiralDisc } from './TimeSpiralDisc'
import { EnergyShell } from './vfx/EnergyShell'

const SHELL: Partial<Record<EnemyProjectileState['kind'], { color: string; core: string; scale: number }>> = {
  'dark-orb': { color: '#ff174d', core: '#ffd0dc', scale: 1.75 },
  'aku-fire': { color: '#ff5a12', core: '#fff0a8', scale: 1.5 },
  stone: { color: '#5aff62', core: '#e0ffd8', scale: 1.35 },
}

export function EnemyProjectileVisual({ kind, travelled = 0 }: { kind: EnemyProjectileState['kind']; travelled?: number }) {
  return (
    <>
      {kind === 'time-portal' ? (
        <group rotation={[0, 0, travelled * 1.8]}>
          <TimeSpiralDisc radius={0.68} opacity={0.98} speed={8.4} />
          <mesh position={[0, 0, -0.03]}><torusGeometry args={[0.73, 0.06, 8, 48]} /><meshBasicMaterial color="#70e8ff" toneMapped={false} /></mesh>
        </group>
      ) : (
        <mesh rotation={[travelled * 2.2, travelled, 0]}>
          {kind === 'stone' ? <dodecahedronGeometry args={[0.32, 0]} /> : <icosahedronGeometry args={[0.31, 2]} />}
          <meshStandardMaterial color={kind === 'stone' ? '#53634b' : '#140008'} emissive={kind === 'stone' ? '#5aff62' : kind === 'aku-fire' ? '#ff7b12' : '#ff002f'} emissiveIntensity={kind === 'stone' ? 0.9 : 2.2} roughness={0.35} />
        </mesh>
      )}
      {SHELL[kind] ? (
        <group scale={SHELL[kind]!.scale} rotation={[travelled, 0, travelled * 1.4]}>
          <EnergyShell color={SHELL[kind]!.color} core={SHELL[kind]!.core} radius={0.3} opacity={kind === 'stone' ? 0.55 : 0.9} bands={14} speed={1.6} />
        </group>
      ) : null}
    </>
  )
}
