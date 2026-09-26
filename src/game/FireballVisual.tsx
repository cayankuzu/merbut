import { EnergyShell } from './vfx/EnergyShell'

/** Ali's fireball: a white-hot core inside a rolling shell of flame; embers come from the particle system. */
export function FireballVisual() {
  return (
    <>
      <mesh><icosahedronGeometry args={[0.17, 2]} /><meshBasicMaterial color="#fff6d0" toneMapped={false} /></mesh>
      <EnergyShell color="#ff4a0e" core="#ffd27a" radius={0.34} fill={0.9} bands={16} speed={2.4} />
      <EnergyShell color="#ff2a06" core="#ff9a24" radius={0.56} opacity={0.45} bands={6} speed={1.6} />
    </>
  )
}
