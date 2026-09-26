import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  DynamicDrawUsage,
  IcosahedronGeometry,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
} from 'three'
import { useShallow } from 'zustand/react/shallow'
import { useSessionStore } from '../store/sessionStore'
import { currentFireballById } from './projectileLookup'
import { createShellMaterial } from './vfx/shellMaterial'

const HIDDEN_SCALE = 0.0001

/** Every fireball in flight shares three draw calls: a white-hot core, a
 * rolling shell of flame and a faint outer halo. The ember wake comes from
 * the particle system (VfxLayer). */
export function FireballProjectiles() {
  const ids = useSessionStore(useShallow((state) => state.projectiles.map((projectile) => projectile.id)))
  const core = useRef<InstancedMesh>(null)
  const flame = useRef<InstancedMesh>(null)
  const halo = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const coreGeometry = useMemo(() => new IcosahedronGeometry(0.17, 2), [])
  const shellGeometry = useMemo(() => new IcosahedronGeometry(1, 3), [])
  const coreMaterial = useMemo(() => new MeshBasicMaterial({ color: '#fff6d0', toneMapped: false }), [])
  const flameMaterial = useMemo(() => createShellMaterial({ color: '#ff4a0e', core: '#ffd27a', fill: 0.9, bands: 16 }), [])
  const haloMaterial = useMemo(() => createShellMaterial({ color: '#ff2a06', core: '#ff9a24', opacity: 0.45, bands: 6 }), [])
  const elapsed = useRef(0)

  useEffect(() => () => {
    coreGeometry.dispose()
    shellGeometry.dispose()
    coreMaterial.dispose()
    flameMaterial.dispose()
    haloMaterial.dispose()
  }, [coreGeometry, coreMaterial, flameMaterial, haloMaterial, shellGeometry])

  useLayoutEffect(() => {
    for (const mesh of [core.current, flame.current, halo.current]) {
      if (!mesh) continue
      mesh.instanceMatrix.setUsage(DynamicDrawUsage)
      mesh.frustumCulled = false
    }
  }, [ids.length])

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1)
    flameMaterial.uniforms.uTime!.value += delta * 2.4
    haloMaterial.uniforms.uTime!.value += delta * 1.6
    elapsed.current += delta
    if (elapsed.current < 1 / 30) return
    elapsed.current %= 1 / 30
    const coreMesh = core.current
    const flameMesh = flame.current
    const haloMesh = halo.current
    if (!coreMesh || !flameMesh || !haloMesh) return

    for (let index = 0; index < ids.length; index += 1) {
      const projectile = currentFireballById(ids[index]!)
      if (!projectile) {
        dummy.scale.setScalar(HIDDEN_SCALE)
        dummy.updateMatrix()
        coreMesh.setMatrixAt(index, dummy.matrix)
        flameMesh.setMatrixAt(index, dummy.matrix)
        haloMesh.setMatrixAt(index, dummy.matrix)
        continue
      }
      dummy.position.set(projectile.x, projectile.y, projectile.z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      coreMesh.setMatrixAt(index, dummy.matrix)
      dummy.scale.setScalar(0.34)
      dummy.updateMatrix()
      flameMesh.setMatrixAt(index, dummy.matrix)
      dummy.scale.setScalar(0.56)
      dummy.updateMatrix()
      haloMesh.setMatrixAt(index, dummy.matrix)
    }
    for (const mesh of [coreMesh, flameMesh, haloMesh]) mesh.instanceMatrix.needsUpdate = true
  })

  if (ids.length === 0) return null
  return (
    <group name="instanced-fireballs">
      <instancedMesh ref={core} args={[coreGeometry, coreMaterial, ids.length]} />
      <instancedMesh ref={flame} args={[shellGeometry, flameMaterial, ids.length]} renderOrder={12} />
      <instancedMesh ref={halo} args={[shellGeometry, haloMaterial, ids.length]} renderOrder={12} />
    </group>
  )
}
