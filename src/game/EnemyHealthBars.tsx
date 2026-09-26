import { useLayoutEffect, useMemo, useRef } from 'react'
import { isMachineVariant } from '../config/enemies'
import { useFrame } from '@react-three/fiber'
import {
  Color,
  DynamicDrawUsage,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
} from 'three'
import { runtimeAnimationFps, usePerformanceStore } from '../store/performanceStore'
import { currentEnemyById } from './enemyLookup'

const HIDDEN_SCALE = 0.0001

export function EnemyHealthBars({ ids }: { ids: readonly string[] }) {
  const background = useRef<InstancedMesh>(null)
  const fill = useRef<InstancedMesh>(null)
  const geometry = useMemo(() => new PlaneGeometry(1, 1), [])
  const backgroundMaterial = useMemo(() => new MeshBasicMaterial({ color: '#10070a', depthTest: false, depthWrite: false, fog: false, toneMapped: false }), [])
  const fillMaterial = useMemo(() => new MeshBasicMaterial({ color: '#ffffff', depthTest: false, depthWrite: false, fog: false, toneMapped: false }), [])
  const backgroundDummy = useMemo(() => new Object3D(), [])
  const fillDummy = useMemo(() => new Object3D(), [])
  const colors = useMemo(() => ids.map((id) => new Color(currentEnemyById(id)?.accent ?? '#ff7657')), [ids])
  const tier = usePerformanceStore((state) => state.tier)
  const qualityFactor = usePerformanceStore((state) => state.qualityFactor)
  const updateFps = Math.min(30, runtimeAnimationFps(tier, qualityFactor))
  const elapsed = useRef(0)

  useLayoutEffect(() => {
    for (const mesh of [background.current, fill.current]) {
      if (!mesh) continue
      mesh.instanceMatrix.setUsage(DynamicDrawUsage)
      mesh.frustumCulled = false
      mesh.renderOrder = 20
    }
    colors.forEach((color, index) => fill.current?.setColorAt(index, color))
    if (fill.current?.instanceColor) fill.current.instanceColor.needsUpdate = true
  }, [colors])

  useFrame((_, rawDelta) => {
    elapsed.current += Math.min(rawDelta, 0.1)
    if (elapsed.current < 1 / updateFps) return
    elapsed.current = 0
    const backgroundMesh = background.current
    const fillMesh = fill.current
    if (!backgroundMesh || !fillMesh) return

    for (let index = 0; index < ids.length; index += 1) {
      const enemy = currentEnemyById(ids[index]!)
      if (!enemy || enemy.animation === 'dead') {
        backgroundDummy.scale.setScalar(HIDDEN_SCALE)
        fillDummy.scale.setScalar(HIDDEN_SCALE)
      } else {
        const width = 1.24
        const ratio = Math.max(0, Math.min(1, enemy.health / enemy.maxHealth))
        // Machines are low and wide; creatures stand tall.
        const y = enemy.scale * (isMachineVariant(enemy.variant) ? 0.78 : 1.9)
        backgroundDummy.position.set(enemy.x, y, enemy.z + 0.46)
        backgroundDummy.scale.set(width, 0.105, 1)
        fillDummy.position.set(enemy.x - width * (1 - ratio) * 0.5, y, enemy.z + 0.47)
        fillDummy.scale.set(Math.max(HIDDEN_SCALE, width * ratio), 0.058, 1)
      }
      backgroundDummy.updateMatrix()
      fillDummy.updateMatrix()
      backgroundMesh.setMatrixAt(index, backgroundDummy.matrix)
      fillMesh.setMatrixAt(index, fillDummy.matrix)
    }
    backgroundMesh.instanceMatrix.needsUpdate = true
    fillMesh.instanceMatrix.needsUpdate = true
  })

  if (ids.length === 0) return null
  return (
    <group name="instanced-enemy-health-bars">
      <instancedMesh ref={background} args={[geometry, backgroundMaterial, ids.length]} />
      <instancedMesh ref={fill} args={[geometry, fillMaterial, ids.length]} />
    </group>
  )
}
