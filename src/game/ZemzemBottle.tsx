import { useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { ASSET_PATHS } from '../config/assetPaths'

export function ZemzemBottle({ id, x }: { id: string; x: number }) {
  const file = useGLTF(ASSET_PATHS.items.zemzem)
  const scene = useMemo(() => file.scene.clone(true), [file.scene])
  const root = useRef<Group>(null)
  useFrame(({ clock }, delta) => {
    if (!root.current) return
    root.current.rotation.y += delta * 1.45
    root.current.position.y = 0.58 + Math.sin(clock.elapsedTime * 2.7 + x) * 0.09
  })
  return (
    <group ref={root} position={[x, 0.58, 0]} name={id}>
      <pointLight color="#77f8ff" intensity={4} distance={3.2} />
      <primitive object={scene} scale={0.38} />
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.46, 0]}>
        <torusGeometry args={[0.46, 0.035, 8, 32]} />
        <meshBasicMaterial color="#8ffcff" transparent opacity={0.75} />
      </mesh>
    </group>
  )
}
