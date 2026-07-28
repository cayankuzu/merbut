import { useMemo, useRef } from 'react'
import { createPortal, useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  ClampToEdgeWrapping,
  DataTexture,
  Group,
  LinearFilter,
  Quaternion,
  RGBAFormat,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3,
  type Object3D,
} from 'three'
import { findAliFaceAnchor } from './aliFaceAnchor'

const FACE_BLUR_LOCAL_Y = 2
const FACE_BLUR_LOCAL_Z = -5.8
const FACE_BLUR_SCALE = [16.9, 22.2, 1] as const
const FACE_BLUR_TEXTURE_SIZE = 128
const FACE_SURFACE_RADIUS_X = 9.6
const FACE_SURFACE_RADIUS_Y = 10.3
const FACE_SURFACE_RADIUS_Z = 9
const FACE_SURFACE_MIN_FORWARD = 0.18

function smoothstep(min: number, max: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  return t * t * (3 - 2 * t)
}

function createFaceBlurTexture() {
  const data = new Uint8Array(FACE_BLUR_TEXTURE_SIZE * FACE_BLUR_TEXTURE_SIZE * 4)
  for (let y = 0; y < FACE_BLUR_TEXTURE_SIZE; y += 1) {
    for (let x = 0; x < FACE_BLUR_TEXTURE_SIZE; x += 1) {
      const nx = (x + 0.5) / FACE_BLUR_TEXTURE_SIZE * 2 - 1
      const ny = (y + 0.5) / FACE_BLUR_TEXTURE_SIZE * 2 - 1
      const radius = Math.sqrt(nx * nx + ny * ny)
      const edge = 1 - smoothstep(0.68, 1, radius)
      const whiteCenter = 1 - smoothstep(0.12, 0.86, radius)
      const offset = (y * FACE_BLUR_TEXTURE_SIZE + x) * 4
      data[offset] = 255
      data[offset + 1] = Math.round(218 + whiteCenter * 37)
      data[offset + 2] = Math.round(112 + whiteCenter * 128)
      data[offset + 3] = Math.round(Math.max(0, Math.min(1, edge * 1.12)) * 255)
    }
  }

  const texture = new DataTexture(data, FACE_BLUR_TEXTURE_SIZE, FACE_BLUR_TEXTURE_SIZE, RGBAFormat)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = LinearFilter
  texture.minFilter = LinearFilter
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}

const FACE_BLUR_TEXTURE = createFaceBlurTexture()

/** Camera-facing luminous blur that follows Ali's animated face anchor. */
export function AliFaceLight({ scene }: { scene: Object3D }) {
  const blurRoot = useRef<Group>(null)
  const sourceMaterial = useRef<SpriteMaterial>(null)
  const anchor = useMemo(() => findAliFaceAnchor(scene), [scene])
  const cameraWorld = useMemo(() => new Vector3(), [])
  const faceWorld = useMemo(() => new Vector3(), [])
  const cameraDirection = useMemo(() => new Vector3(), [])
  const surfaceDirection = useMemo(() => new Vector3(), [])
  const inverseFaceRotation = useMemo(() => new Quaternion(), [])
  const portalParent = anchor?.parent ?? null
  const facePosition = useMemo(() => anchor
    ? new Vector3(
      anchor.position.x,
      anchor.position.y + FACE_BLUR_LOCAL_Y,
      anchor.position.z + FACE_BLUR_LOCAL_Z,
    )
    : null, [anchor])

  useFrame(({ camera, clock, invalidate }) => {
    const time = clock.elapsedTime
    const pulse = 1 + Math.sin(time * 1.9) * 0.012
    const root = blurRoot.current
    if (root && portalParent && facePosition) {
      portalParent.getWorldQuaternion(inverseFaceRotation).invert()
      faceWorld.copy(facePosition).applyMatrix4(portalParent.matrixWorld)
      camera.getWorldPosition(cameraWorld)
      cameraDirection
        .copy(cameraWorld)
        .sub(faceWorld)
        .applyQuaternion(inverseFaceRotation)
        .normalize()
      // Keep the sprites on the camera-facing surface of an invisible face oval.
      // The model's real depth then hides them naturally behind the skull.
      surfaceDirection
        .copy(cameraDirection)
        .setZ(Math.max(FACE_SURFACE_MIN_FORWARD, cameraDirection.z))
      const denominator = Math.sqrt(
        (FACE_SURFACE_RADIUS_X * surfaceDirection.x) ** 2
        + (FACE_SURFACE_RADIUS_Y * surfaceDirection.y) ** 2
        + (FACE_SURFACE_RADIUS_Z * surfaceDirection.z) ** 2,
      )
      root.position.set(
        facePosition.x + FACE_SURFACE_RADIUS_X ** 2 * surfaceDirection.x / denominator,
        facePosition.y + FACE_SURFACE_RADIUS_Y ** 2 * surfaceDirection.y / denominator,
        facePosition.z + FACE_SURFACE_RADIUS_Z ** 2 * surfaceDirection.z / denominator,
      )
      root.scale.setScalar(pulse)
    }
    if (sourceMaterial.current) {
      sourceMaterial.current.opacity = 0.88 + Math.sin(time * 3.1) * 0.08
    }
    invalidate()
  })

  if (!portalParent || !facePosition) return null
  return createPortal(
    <group ref={blurRoot} name="ali-yuz-nuru" position={facePosition} dispose={null}>
      <sprite
        scale={FACE_BLUR_SCALE}
        renderOrder={999}
        frustumCulled={false}
        dispose={null}
      >
        <spriteMaterial
          map={FACE_BLUR_TEXTURE}
          color="#fff4c9"
          transparent
          opacity={0.98}
          depthTest
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      <sprite
        scale={[18.4, 24, 1]}
        position={[0, 0, 0.08]}
        renderOrder={1000}
        frustumCulled={false}
        dispose={null}
      >
        <spriteMaterial
          map={FACE_BLUR_TEXTURE}
          color="#ffd36f"
          transparent
          opacity={0.28}
          blending={AdditiveBlending}
          depthTest
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      <sprite
        scale={[4.2, 5.1, 1]}
        position={[0, 0, 0.12]}
        renderOrder={1001}
        frustumCulled={false}
        dispose={null}
      >
        <spriteMaterial
          ref={sourceMaterial}
          map={FACE_BLUR_TEXTURE}
          color="#fffdf0"
          transparent
          opacity={0.88}
          blending={AdditiveBlending}
          depthTest
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
    </group>,
    portalParent,
  )
}
