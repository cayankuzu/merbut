import { useMemo, type MutableRefObject, type RefObject } from 'react'
import { AdditiveBlending, type Mesh, type MeshBasicMaterial, type PointLight } from 'three'
import { ALI_FLAME_ARCS, createAliFlameArcGeometry } from './heroCombatGeometry'

interface AliFlameTrailVisualProps {
  arcs?: MutableRefObject<Mesh[]>
  materials?: MutableRefObject<MeshBasicMaterial[]>
  light?: RefObject<PointLight | null>
}

export function AliFlameTrailVisual({ arcs, materials, light }: AliFlameTrailVisualProps) {
  const geometry = useMemo(createAliFlameArcGeometry, [])
  return (
    <>
      <pointLight ref={light} color="#ff5a16" intensity={0} distance={5} decay={2} />
      {ALI_FLAME_ARCS.map((arc, index) => (
        <mesh key={arc.color} ref={(mesh) => { if (mesh && arcs) arcs.current[index] = mesh }} geometry={geometry} position={arc.position} rotation={[0, 0, arc.rotation]}>
          <meshBasicMaterial ref={(material) => { if (material && materials) materials.current[index] = material }} color={arc.color} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
        </mesh>
      ))}
    </>
  )
}
