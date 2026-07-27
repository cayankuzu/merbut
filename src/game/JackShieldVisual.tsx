import { AdditiveBlending } from 'three'

export function JackShieldVisual() {
  return (
    <>
      <pointLight color="#8ee9ff" intensity={8} distance={6} />
      <mesh scale={[1.35, 1.6, 1.35]}><sphereGeometry args={[1.35, 18, 12]} /><meshBasicMaterial color="#9deaff" transparent opacity={0.12} wireframe blending={AdditiveBlending} depthWrite={false} /></mesh>
      {[0, Math.PI / 3, -Math.PI / 3].map((rotation) => (
        <mesh key={rotation} rotation={[Math.PI / 2, rotation, 0]}><torusGeometry args={[1.62, 0.035, 8, 48]} /><meshBasicMaterial color="#e6fbff" transparent opacity={0.72} toneMapped={false} /></mesh>
      ))}
    </>
  )
}
