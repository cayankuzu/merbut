import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  ClampToEdgeWrapping,
  DataTexture,
  Group,
  LinearFilter,
  RGBAFormat,
  SRGBColorSpace,
  Vector3,
  type Object3D,
} from 'three'
import { findAliFaceAnchor } from './aliFaceAnchor'

const FACE_LIGHT_SIZE = 32

function createFaceLightTexture() {
  const data = new Uint8Array(FACE_LIGHT_SIZE * FACE_LIGHT_SIZE * 4)
  for (let y = 0; y < FACE_LIGHT_SIZE; y += 1) {
    for (let x = 0; x < FACE_LIGHT_SIZE; x += 1) {
      const nx = (x + 0.5) / FACE_LIGHT_SIZE * 2 - 1
      const ny = (y + 0.5) / FACE_LIGHT_SIZE * 2 - 1
      const distance = Math.sqrt(nx * nx + ny * ny)
      const alpha = distance <= 0.58
        ? 1
        : Math.max(0, 1 - (distance - 0.58) / 0.42) ** 2
      const offset = (y * FACE_LIGHT_SIZE + x) * 4
      data[offset] = 255
      data[offset + 1] = 250
      data[offset + 2] = 222
      data[offset + 3] = Math.round(alpha * 255)
    }
  }
  const texture = new DataTexture(data, FACE_LIGHT_SIZE, FACE_LIGHT_SIZE, RGBAFormat)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = LinearFilter
  texture.minFilter = LinearFilter
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}

// Shared by every Ali instance: one tiny texture, no per-model canvas or light.
const FACE_LIGHT_TEXTURE = createFaceLightTexture()

/** Camera-facing, depth-independent veil that keeps Ali's face respectfully obscured. */
export function AliFaceLight({ scene }: { scene: Object3D }) {
  const root = useRef<Group>(null)
  const anchor = useMemo(() => findAliFaceAnchor(scene), [scene])
  const anchorWorld = useMemo(() => new Vector3(), [])

  useFrame(({ clock }) => {
    const light = root.current
    const parent = light?.parent
    if (!light || !parent || !anchor) return
    anchor.updateWorldMatrix(true, false)
    anchor.getWorldPosition(anchorWorld)
    parent.updateWorldMatrix(true, false)
    light.position.copy(parent.worldToLocal(anchorWorld))
    light.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.2) * 0.018)
  })

  return (
    <group ref={root} position={[0, 1.461, 0.185]} name="ali-yuz-nuru">
      <sprite scale={[0.92, 1.02, 1]} renderOrder={998} frustumCulled={false}>
        <spriteMaterial
          map={FACE_LIGHT_TEXTURE}
          color="#ffd98a"
          transparent
          opacity={0.34}
          blending={AdditiveBlending}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      <sprite scale={[0.64, 0.7, 1]} renderOrder={999} frustumCulled={false}>
        <spriteMaterial
          map={FACE_LIGHT_TEXTURE}
          color="#fffdf0"
          transparent
          opacity={1}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
    </group>
  )
}
