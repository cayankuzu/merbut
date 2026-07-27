import { useMemo, type MutableRefObject } from 'react'
import { AdditiveBlending, type Mesh, type MeshBasicMaterial } from 'three'
import { ALI_FLAME_ARCS, createAliFlameArcGeometry } from './heroCombatGeometry'

interface AliFlameTrailVisualProps {
  arcs?: MutableRefObject<Mesh[]>
  materials?: MutableRefObject<MeshBasicMaterial[]>
}

export function AliFlameTrailVisual({ arcs, materials }: AliFlameTrailVisualProps) {
  const geometry = useMemo(createAliFlameArcGeometry, [])
  return (
    <>
      {ALI_FLAME_ARCS.map((arc, index) => (
        <mesh key={arc.color} ref={(mesh) => { if (mesh && arcs) arcs.current[index] = mesh }} geometry={geometry} position={arc.position} rotation={[0, 0, arc.rotation]}>
          <meshBasicMaterial ref={(material) => { if (material && materials) materials.current[index] = material }} color={arc.color} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
        </mesh>
      ))}
    </>
  )
}
