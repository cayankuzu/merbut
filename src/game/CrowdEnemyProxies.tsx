import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BoxGeometry,
  Color,
  ConeGeometry,
  DynamicDrawUsage,
  InstancedMesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
} from 'three'
import { runtimeAnimationFps, usePerformanceStore } from '../store/performanceStore'
import { currentEnemyById } from './enemyLookup'

interface CrowdEnemyProxiesProps {
  ids: readonly string[]
}

const HIDDEN_SCALE = 0.0001
const WHITE = new Color('#ffffff')

function seededPhase(id: string) {
  let value = 0
  for (let index = 0; index < id.length; index += 1) value = (value * 31 + id.charCodeAt(index)) >>> 0
  return (value % 628) / 100
}

/**
 * A three-draw-call fallback for live enemies that do not need a full skinned
 * actor. It intentionally has no health bars, shadows or per-enemy React
 * subscriptions. The game simulation still owns every enemy; this component
 * only changes their visual representation.
 */
export function CrowdEnemyProxies({ ids }: CrowdEnemyProxiesProps) {
  const bodyRef = useRef<InstancedMesh>(null)
  const headRef = useRef<InstancedMesh>(null)
  const weaponRef = useRef<InstancedMesh>(null)
  const bodyGeometry = useMemo(() => new ConeGeometry(0.33, 1.28, 8), [])
  const headGeometry = useMemo(() => new SphereGeometry(0.24, 12, 8), [])
  const weaponGeometry = useMemo(() => new BoxGeometry(0.12, 0.72, 0.12), [])
  const material = useMemo(() => new MeshLambertMaterial({ color: '#ffffff' }), [])
  const headMaterial = useMemo(() => new MeshLambertMaterial({ color: '#ffffff' }), [])
  const accentMaterial = useMemo(() => new MeshStandardMaterial({ color: '#ffffff', metalness: 0.64, roughness: 0.28 }), [])
  const bodyDummy = useMemo(() => new Object3D(), [])
  const headDummy = useMemo(() => new Object3D(), [])
  const weaponDummy = useMemo(() => new Object3D(), [])
  const colors = useMemo(() => ids.map((id) => {
    const body = new Color(currentEnemyById(id)?.accent ?? '#8d273e')
    return {
      body,
      head: body.clone().lerp(WHITE, 0.34),
      weapon: body.clone().lerp(WHITE, 0.62),
    }
  }), [ids])
  const phases = useMemo(() => ids.map(seededPhase), [ids])
  const tier = usePerformanceStore((state) => state.tier)
  const qualityFactor = usePerformanceStore((state) => state.qualityFactor)
  const animationFps = runtimeAnimationFps(tier, qualityFactor)
  const transformAccumulator = useRef(0)

  useEffect(() => () => {
    bodyGeometry.dispose()
    headGeometry.dispose()
    weaponGeometry.dispose()
    material.dispose()
    headMaterial.dispose()
    accentMaterial.dispose()
  }, [accentMaterial, bodyGeometry, headGeometry, headMaterial, material, weaponGeometry])

  useLayoutEffect(() => {
    const meshes = [bodyRef.current, headRef.current, weaponRef.current]
    meshes.forEach((mesh) => {
      if (!mesh) return
      mesh.instanceMatrix.setUsage(DynamicDrawUsage)
      mesh.castShadow = false
      mesh.receiveShadow = false
      mesh.frustumCulled = false
    })
    const body = bodyRef.current
    const head = headRef.current
    const weapon = weaponRef.current
    if (!body || !head || !weapon) return
    colors.forEach((color, index) => {
      body.setColorAt(index, color.body)
      head.setColorAt(index, color.head)
      weapon.setColorAt(index, color.weapon)
    })
    if (body.instanceColor) body.instanceColor.needsUpdate = true
    if (head.instanceColor) head.instanceColor.needsUpdate = true
    if (weapon.instanceColor) weapon.instanceColor.needsUpdate = true
  }, [colors, ids.length])

  useFrame((state, rawDelta) => {
    transformAccumulator.current += Math.min(rawDelta, 0.1)
    const updateEvery = 1 / animationFps
    if (transformAccumulator.current < updateEvery) return
    transformAccumulator.current = 0
    const time = state.clock.elapsedTime
    const body = bodyRef.current
    const head = headRef.current
    const weapon = weaponRef.current
    if (!body || !head || !weapon) return

    for (let index = 0; index < ids.length; index += 1) {
      const enemy = currentEnemyById(ids[index]!)
      if (!enemy || enemy.animation === 'dead') {
        bodyDummy.scale.setScalar(HIDDEN_SCALE)
        headDummy.scale.setScalar(HIDDEN_SCALE)
        weaponDummy.scale.setScalar(HIDDEN_SCALE)
      } else {
        const phase = phases[index]!
        const scale = enemy.scale * 0.58
        const walking = enemy.animation === 'walk'
        const attacking = enemy.animation === 'attack'
        const stride = walking ? Math.sin(time * 8.5 + phase) : 0
        const bob = walking ? Math.abs(stride) * 0.09 : attacking ? Math.sin(time * 17 + phase) * 0.035 : Math.sin(time * 2 + phase) * 0.018
        const lean = attacking ? enemy.direction * -0.24 : 0
        const forward = enemy.direction * scale
        bodyDummy.position.set(enemy.x, 0.38 * scale + bob, 0)
        bodyDummy.rotation.set(0, enemy.direction > 0 ? Math.PI / 2 : -Math.PI / 2, lean)
        bodyDummy.scale.setScalar(scale)
        bodyDummy.updateMatrix()
        body.setMatrixAt(index, bodyDummy.matrix)

        headDummy.position.set(enemy.x + forward * 0.06, 1.18 * scale + bob, 0)
        headDummy.rotation.set(0, 0, 0)
        headDummy.scale.setScalar(scale)
        headDummy.updateMatrix()
        head.setMatrixAt(index, headDummy.matrix)

        const swing = attacking ? Math.sin(time * 22 + phase) * 0.64 : stride * 0.18
        weaponDummy.position.set(enemy.x + forward * (attacking ? 0.62 : 0.42), 0.72 * scale + bob, 0)
        weaponDummy.rotation.set(0, 0, enemy.direction * (-0.56 + swing))
        weaponDummy.scale.setScalar(scale)
        weaponDummy.updateMatrix()
        weapon.setMatrixAt(index, weaponDummy.matrix)
      }

      if (!enemy || enemy.animation === 'dead') {
        bodyDummy.updateMatrix()
        headDummy.updateMatrix()
        weaponDummy.updateMatrix()
        body.setMatrixAt(index, bodyDummy.matrix)
        head.setMatrixAt(index, headDummy.matrix)
        weapon.setMatrixAt(index, weaponDummy.matrix)
      }
    }
    body.instanceMatrix.needsUpdate = true
    head.instanceMatrix.needsUpdate = true
    weapon.instanceMatrix.needsUpdate = true
  })

  if (ids.length === 0) return null
  return (
    <group name="crowd-enemy-proxies">
      <instancedMesh ref={bodyRef} args={[bodyGeometry, material, ids.length]} />
      <instancedMesh ref={headRef} args={[headGeometry, headMaterial, ids.length]} />
      <instancedMesh ref={weaponRef} args={[weaponGeometry, accentMaterial, ids.length]} />
    </group>
  )
}
