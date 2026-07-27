export function FireballVisual({ directionX = 1, directionZ = 0 }: { directionX?: number; directionZ?: number }) {
  return (
    <>
      <mesh><icosahedronGeometry args={[0.28, 2]} /><meshBasicMaterial color="#fff0a2" toneMapped={false} /></mesh>
      <mesh scale={1.75}><icosahedronGeometry args={[0.27, 1]} /><meshBasicMaterial color="#ff3b0b" transparent opacity={0.42} toneMapped={false} /></mesh>
      {[0.45, 0.85, 1.2].map((distance, index) => (
        <mesh key={distance} position={[-directionX * distance, 0, -directionZ * distance]} scale={1 - index * 0.2}>
          <octahedronGeometry args={[0.19, 0]} />
          <meshBasicMaterial color={index === 0 ? '#ff9a24' : '#d92b08'} transparent opacity={0.72 - index * 0.16} toneMapped={false} />
        </mesh>
      ))}
    </>
  )
}
