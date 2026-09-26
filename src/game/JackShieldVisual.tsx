import { EnergyShell } from './vfx/EnergyShell'
import { LIGHT_BLENDING } from './vfx/lightBlending'

/** Jack's guard: a cold-blue shell of light with three thin orbiting rings. */
export function JackShieldVisual() {
  return (
    <>
      <group scale={[1.35, 1.6, 1.35]}>
        <EnergyShell color="#5fc8ff" core="#e6fbff" radius={1.35} opacity={0.85} bands={7} />
      </group>
      {[0, Math.PI / 3, -Math.PI / 3].map((rotation) => (
        <mesh key={rotation} rotation={[Math.PI / 2, rotation, 0]}>
          <torusGeometry args={[1.62, 0.018, 6, 64]} />
          <meshBasicMaterial color="#e6fbff" transparent opacity={0.62} {...LIGHT_BLENDING} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </>
  )
}
