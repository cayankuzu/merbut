import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  DataTexture,
  DynamicDrawUsage,
  InstancedMesh,
  LinearFilter,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  RGBAFormat,
  UnsignedByteType,
} from 'three'
import { useShallow } from 'zustand/react/shallow'
import { useDebugStore } from '../store/debugStore'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'
import { currentEnemyById } from './enemyLookup'

const CHARACTER_IDS = ['ali', 'jack'] as const
const HIDDEN_SCALE = 0.0001
const SHADOW_TEXTURE_SIZE = 64

function createSoftShadowTexture() {
  const pixels = new Uint8Array(SHADOW_TEXTURE_SIZE * SHADOW_TEXTURE_SIZE * 4)
  for (let y = 0; y < SHADOW_TEXTURE_SIZE; y += 1) {
    for (let x = 0; x < SHADOW_TEXTURE_SIZE; x += 1) {
      const nx = (x + 0.5) / SHADOW_TEXTURE_SIZE * 2 - 1
      const ny = (y + 0.5) / SHADOW_TEXTURE_SIZE * 2 - 1
      const distance = Math.sqrt(nx * nx + ny * ny)
      const falloff = Math.max(0, Math.min(1, (1 - distance) / 0.72))
      const alpha = Math.round(falloff * falloff * (3 - 2 * falloff) * 255)
      const offset = (y * SHADOW_TEXTURE_SIZE + x) * 4
      pixels[offset] = 255
      pixels[offset + 1] = alpha
      pixels[offset + 2] = 255
      pixels[offset + 3] = 255
    }
  }
  const texture = new DataTexture(pixels, SHADOW_TEXTURE_SIZE, SHADOW_TEXTURE_SIZE, RGBAFormat, UnsignedByteType)
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}

/**
 * One draw call replaces per-character shadow-map and contact-shadow passes.
 * Positions are read imperatively so movement never re-renders React.
 */
export function ActorContactShadows() {
  const ids = useSessionStore(useShallow((state) => state.enemies.map((enemy) => enemy.id)))
  const groundHeight = useDebugStore((state) => state.groundHeight)
  const mesh = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const geometry = useMemo(() => new PlaneGeometry(1, 1), [])
  const texture = useMemo(createSoftShadowTexture, [])
  const material = useMemo(() => new MeshBasicMaterial({
    alphaMap: texture,
    color: '#0b080d',
    depthWrite: false,
    opacity: 0.36,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    toneMapped: false,
    transparent: true,
  }), [texture])
  const instanceCount = CHARACTER_IDS.length + ids.length
  const updateElapsed = useRef(0)

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
    texture.dispose()
  }, [geometry, material, texture])

  useLayoutEffect(() => {
    if (!mesh.current) return
    mesh.current.instanceMatrix.setUsage(DynamicDrawUsage)
    mesh.current.frustumCulled = false
    mesh.current.renderOrder = 2
  }, [instanceCount])

  useFrame((_, rawDelta) => {
    updateElapsed.current += Math.min(rawDelta, 0.1)
    if (updateElapsed.current < 1 / 30) return
    updateElapsed.current %= 1 / 30
    const target = mesh.current
    if (!target) return

    const game = useGameStore.getState()
    const session = useSessionStore.getState()
    const hidePlayers = session.phase === 'ending'
    CHARACTER_IDS.forEach((id, index) => {
      const position = game.positions[id]
      const height = Math.max(0, position[1] - groundHeight)
      const airborneScale = Math.max(0.58, 1 - height * 0.1)
      dummy.position.set(position[0], groundHeight + 0.035, 0.04)
      dummy.rotation.set(-Math.PI / 2, 0, 0)
      dummy.scale.set(
        hidePlayers || session.players[id].dead ? HIDDEN_SCALE : 1.48 * airborneScale,
        hidePlayers || session.players[id].dead ? HIDDEN_SCALE : 0.76 * airborneScale,
        1,
      )
      dummy.updateMatrix()
      target.setMatrixAt(index, dummy.matrix)
    })

    const now = performance.now()
    ids.forEach((id, idIndex) => {
      const index = CHARACTER_IDS.length + idIndex
      const enemy = currentEnemyById(id)
      const deathScale = enemy?.animation === 'dead'
        ? Math.max(0, 1 - (now - enemy.deadAt) / 650)
        : 1
      const scale = enemy ? enemy.scale * deathScale : 0
      dummy.position.set(enemy?.x ?? 0, groundHeight + 0.034, 0.035)
      dummy.rotation.set(-Math.PI / 2, 0, 0)
      dummy.scale.set(
        scale > 0 ? Math.max(0.68, 1.2 * scale) : HIDDEN_SCALE,
        scale > 0 ? Math.max(0.38, 0.62 * scale) : HIDDEN_SCALE,
        1,
      )
      dummy.updateMatrix()
      target.setMatrixAt(index, dummy.matrix)
    })
    target.instanceMatrix.needsUpdate = true
  })

  return instanceCount > 0 ? (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, instanceCount]}
      name="instanced-actor-contact-shadows"
    />
  ) : null
}
