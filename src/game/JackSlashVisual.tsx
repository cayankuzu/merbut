import { useMemo, type MutableRefObject } from 'react'
import { AdditiveBlending, DoubleSide, type Mesh, type MeshBasicMaterial } from 'three'
import { createJackSlashGeometry, JACK_SLASHES } from './heroCombatGeometry'

interface JackSlashVisualProps {
  meshes?: MutableRefObject<Mesh[]>
  materials?: MutableRefObject<MeshBasicMaterial[]>
}

export function JackSlashVisual({ meshes, materials }: JackSlashVisualProps) {
  const geometry = useMemo(createJackSlashGeometry, [])
  return (
    <>
      {JACK_SLASHES.map((index) => (
        <mesh geometry={geometry} key={`jack-slash-${index}`} position={[(index - 1) * 0.16, (index - 1) * 0.23, index * 0.025]} rotation={[0, 0, -0.38 + index * 0.31]} scale={[1 - index * 0.11, 1 - index * 0.08, 1]} ref={(mesh) => { if (mesh && meshes) meshes.current[index] = mesh }}>
          <meshBasicMaterial ref={(material) => { if (material && materials) materials.current[index] = material }} color={index === 1 ? '#ffffff' : '#b9eaff'} transparent opacity={0} side={DoubleSide} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
        </mesh>
      ))}
    </>
  )
}
