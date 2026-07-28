import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  DynamicDrawUsage,
  IcosahedronGeometry,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  OctahedronGeometry,
} from 'three'
import { useShallow } from 'zustand/react/shallow'
import { useSessionStore } from '../store/sessionStore'
import { currentFireballById } from './projectileLookup'

const HIDDEN_SCALE = 0.0001
const TRAILS = [
  { color: '#ff9a24', distance: 0.45, opacity: 0.72, scale: 1 },
  { color: '#d92b08', distance: 0.85, opacity: 0.56, scale: 0.8 },
  { color: '#d92b08', distance: 1.2, opacity: 0.4, scale: 0.6 },
] as const

/** Nine fireballs previously expanded to 45 meshes. The same five visual
 * layers now stay at five draw calls regardless of projectile count. */
export function FireballProjectiles() {
  const ids = useSessionStore(useShallow((state) => state.projectiles.map((projectile) => projectile.id)))
  const core = useRef<InstancedMesh>(null)
  const glow = useRef<InstancedMesh>(null)
  const trails = useRef<Array<InstancedMesh | null>>([])
  const dummy = useMemo(() => new Object3D(), [])
  const coreGeometry = useMemo(() => new IcosahedronGeometry(0.28, 2), [])
  const glowGeometry = useMemo(() => new IcosahedronGeometry(0.27, 1), [])
  const trailGeometry = useMemo(() => new OctahedronGeometry(0.19, 0), [])
  const coreMaterial = useMemo(() => new MeshBasicMaterial({ color: '#fff0a2', toneMapped: false }), [])
  const glowMaterial = useMemo(() => new MeshBasicMaterial({ color: '#ff3b0b', opacity: 0.42, toneMapped: false, transparent: true }), [])
  const trailMaterials = useMemo(() => TRAILS.map((trail) => new MeshBasicMaterial({
    color: trail.color,
    opacity: trail.opacity,
    toneMapped: false,
    transparent: true,
  })), [])
  const elapsed = useRef(0)

  useEffect(() => () => {
    coreGeometry.dispose()
    glowGeometry.dispose()
    trailGeometry.dispose()
    coreMaterial.dispose()
    glowMaterial.dispose()
    trailMaterials.forEach((material) => material.dispose())
  }, [coreGeometry, coreMaterial, glowGeometry, glowMaterial, trailGeometry, trailMaterials])

  useLayoutEffect(() => {
    for (const mesh of [core.current, glow.current, ...trails.current]) {
      if (!mesh) continue
      mesh.instanceMatrix.setUsage(DynamicDrawUsage)
      mesh.frustumCulled = false
    }
  }, [ids.length])

  useFrame((_, rawDelta) => {
    elapsed.current += Math.min(rawDelta, 0.1)
    if (elapsed.current < 1 / 30) return
    elapsed.current %= 1 / 30
    const coreMesh = core.current
    const glowMesh = glow.current
    if (!coreMesh || !glowMesh) return

    for (let index = 0; index < ids.length; index += 1) {
      const projectile = currentFireballById(ids[index]!)
      if (!projectile) {
        dummy.scale.setScalar(HIDDEN_SCALE)
        dummy.updateMatrix()
        coreMesh.setMatrixAt(index, dummy.matrix)
        glowMesh.setMatrixAt(index, dummy.matrix)
        trails.current.forEach((mesh) => mesh?.setMatrixAt(index, dummy.matrix))
        continue
      }

      dummy.position.set(projectile.x, projectile.y, projectile.z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      coreMesh.setMatrixAt(index, dummy.matrix)

      dummy.scale.setScalar(1.75)
      dummy.updateMatrix()
      glowMesh.setMatrixAt(index, dummy.matrix)

      TRAILS.forEach((trail, trailIndex) => {
        dummy.position.set(
          projectile.x - projectile.directionX * trail.distance,
          projectile.y,
          projectile.z - projectile.directionZ * trail.distance,
        )
        dummy.scale.setScalar(trail.scale)
        dummy.updateMatrix()
        trails.current[trailIndex]?.setMatrixAt(index, dummy.matrix)
      })
    }
    for (const mesh of [coreMesh, glowMesh, ...trails.current]) {
      if (mesh) mesh.instanceMatrix.needsUpdate = true
    }
  })

  if (ids.length === 0) return null
  return (
    <group name="instanced-fireballs">
      <instancedMesh ref={core} args={[coreGeometry, coreMaterial, ids.length]} />
      <instancedMesh ref={glow} args={[glowGeometry, glowMaterial, ids.length]} />
      {TRAILS.map((trail, index) => (
        <instancedMesh
          ref={(mesh) => { trails.current[index] = mesh }}
          args={[trailGeometry, trailMaterials[index], ids.length]}
          key={trail.distance}
        />
      ))}
    </group>
  )
}
