import type { EnemyProjectileState } from '../types/session'
import { TimeSpiralDisc } from './TimeSpiralDisc'

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
          <meshStandardMaterial color={kind === 'stone' ? '#53634b' : '#140008'} emissive={kind === 'stone' ? '#5aff62' : kind === 'aku-fire' ? '#ff7b12' : '#ff002f'} emissiveIntensity={2.2} roughness={0.35} />
        </mesh>
      )}
      {kind === 'dark-orb' ? <mesh scale={1.75} rotation={[travelled, 0, travelled * 1.4]}><sphereGeometry args={[0.3, 14, 10]} /><meshBasicMaterial color="#ff174d" wireframe transparent opacity={0.48} /></mesh> : null}
    </>
  )
}
