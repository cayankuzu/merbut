import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  ConeGeometry,
  DynamicDrawUsage,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  RingGeometry,
  TorusGeometry,
} from 'three'
import { useShallow } from 'zustand/react/shallow'
import { useSessionStore } from '../store/sessionStore'
import { AKU_FIRE_SPIKE_RADIUS } from './akuCombat'
import { currentMeteorById } from './projectileLookup'
import type { MeteorState } from '../types/session'

const SHADOW_THORNS = Array.from({ length: 18 }, (_, index) => index / 18 * Math.PI * 2)
const AKU_SPIKES = Array.from({ length: 28 }, (_, index) => ({
  angle: index / 28 * Math.PI * 2,
  radius: AKU_FIRE_SPIKE_RADIUS * (index % 2 === 0 ? 0.94 : 0.58),
}))

interface SpikeInstance {
  angle: number
  radius: number
  tilt: number
}

function InstancedSpikeField({
  color,
  emissive,
  emissiveIntensity,
  height,
  instances,
  radius,
  roughness = 1,
  y,
}: {
  color: string
  emissive: string
  emissiveIntensity: number
  height: number
  instances: readonly SpikeInstance[]
  radius: number
  roughness?: number
  y: number
}) {
  const mesh = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const geometry = useMemo(() => new ConeGeometry(radius, height, 5), [height, radius])
  const material = useMemo(() => new MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity,
    roughness,
  }), [color, emissive, emissiveIntensity, roughness])

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  useLayoutEffect(() => {
    const target = mesh.current
    if (!target) return
    instances.forEach((instance, index) => {
      dummy.position.set(
        Math.cos(instance.angle) * instance.radius,
        y,
        Math.sin(instance.angle) * instance.radius,
      )
      dummy.rotation.set(0, -instance.angle, instance.tilt)
      dummy.updateMatrix()
      target.setMatrixAt(index, dummy.matrix)
    })
    target.instanceMatrix.needsUpdate = true
    target.computeBoundingSphere()
  }, [dummy, instances, y])

  return <instancedMesh ref={mesh} args={[geometry, material, instances.length]} />
}

const SHADOW_SPIKE_INSTANCES = SHADOW_THORNS.map((angle) => ({
  angle,
  radius: 2.72,
  tilt: Math.PI / 7,
}))
const AKU_TALL_SPIKES = AKU_SPIKES.filter((_, index) => index % 2 === 0).map(({ angle, radius }) => ({
  angle,
  radius,
  tilt: 0.28,
}))
const AKU_SHORT_SPIKES = AKU_SPIKES.filter((_, index) => index % 2 !== 0).map(({ angle, radius }) => ({
  angle,
  radius,
  tilt: -0.22,
}))

function InstancedMeteorField({ ids, kind }: { ids: readonly string[]; kind: MeteorState['kind'] }) {
  const warning = useRef<InstancedMesh>(null)
  const border = useRef<InstancedMesh>(null)
  const orb = useRef<InstancedMesh>(null)
  const updateAccumulator = useRef(0)
  const dummy = useMemo(() => new Object3D(), [])
  const warningGeometry = useMemo(() => new RingGeometry(0.78, 1.18, 42), [])
  const borderGeometry = useMemo(() => new TorusGeometry(0.98, 0.06, 8, 42), [])
  const orbGeometry = useMemo(() => new IcosahedronGeometry(0.5, 2), [])
  const warningMaterial = useMemo(() => new MeshBasicMaterial({
    blending: AdditiveBlending,
    color: kind === 'fire' ? '#ff8b20' : '#ff173f',
    depthWrite: false,
    opacity: 0.48,
    transparent: true,
  }), [kind])
  const borderMaterial = useMemo(() => new MeshBasicMaterial({ color: '#120008' }), [])
  const orbMaterial = useMemo(() => new MeshStandardMaterial({
    color: '#050006',
    emissive: kind === 'fire' ? '#ff7517' : '#ff0b34',
    emissiveIntensity: 2.5,
    roughness: 0.2,
  }), [kind])

  useEffect(() => () => {
    warningGeometry.dispose()
    borderGeometry.dispose()
    orbGeometry.dispose()
    warningMaterial.dispose()
    borderMaterial.dispose()
    orbMaterial.dispose()
  }, [borderGeometry, borderMaterial, orbGeometry, orbMaterial, warningGeometry, warningMaterial])

  useLayoutEffect(() => {
    dummy.scale.setScalar(0.0001)
    dummy.updateMatrix()
    for (const mesh of [warning.current, border.current, orb.current]) {
      if (!mesh) continue
      mesh.instanceMatrix.setUsage(DynamicDrawUsage)
      mesh.frustumCulled = false
      for (let index = 0; index < ids.length; index += 1) mesh.setMatrixAt(index, dummy.matrix)
      mesh.instanceMatrix.needsUpdate = true
    }
  }, [dummy, ids.length])

  useFrame((_, delta) => {
    updateAccumulator.current += Math.min(delta, 0.1)
    if (updateAccumulator.current < 1 / 30) return
    updateAccumulator.current %= 1 / 30
    const warningMesh = warning.current
    const borderMesh = border.current
    const orbMesh = orb.current
    if (!warningMesh || !borderMesh || !orbMesh) return
    const now = performance.now()
    ids.forEach((id, index) => {
      const meteor = currentMeteorById(id)
      const active = meteor && now >= meteor.createdAt
      if (!active) {
        dummy.scale.setScalar(0.0001)
        dummy.updateMatrix()
        warningMesh.setMatrixAt(index, dummy.matrix)
        borderMesh.setMatrixAt(index, dummy.matrix)
        orbMesh.setMatrixAt(index, dummy.matrix)
        return
      }

      const total = Math.max(1, meteor.impactAt - meteor.createdAt)
      const progress = Math.min(1, Math.max(0, (now - meteor.createdAt) / total))
      const pulse = 0.78 + Math.sin(now * 0.014) * 0.18
      const fieldScale = pulse * (0.7 + progress * 0.75)
      dummy.position.set(meteor.x, 0.04, 0)
      dummy.rotation.set(Math.PI / 2, 0, 0)
      dummy.scale.set(fieldScale, fieldScale, 1)
      dummy.updateMatrix()
      warningMesh.setMatrixAt(index, dummy.matrix)

      dummy.position.y = 0.055
      dummy.updateMatrix()
      borderMesh.setMatrixAt(index, dummy.matrix)

      const fallProgress = Math.min(1, Math.max(0, (now - meteor.impactAt + 1_100) / 1_100))
      if (fallProgress <= 0 || meteor.landedAt !== 0) {
        dummy.scale.setScalar(0.0001)
      } else {
        const orbScale = 0.5 + fallProgress * 0.6
        dummy.position.set(meteor.x, 9.54 - fallProgress * 9.1, 0)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.set(orbScale * pulse, orbScale, orbScale * pulse)
      }
      dummy.updateMatrix()
      orbMesh.setMatrixAt(index, dummy.matrix)
    })
    warningMesh.instanceMatrix.needsUpdate = true
    borderMesh.instanceMatrix.needsUpdate = true
    orbMesh.instanceMatrix.needsUpdate = true
  })

  if (ids.length === 0) return null
  return (
    <group name={`instanced-${kind}-meteors`}>
      <instancedMesh ref={warning} args={[warningGeometry, warningMaterial, ids.length]} />
      <instancedMesh ref={border} args={[borderGeometry, borderMaterial, ids.length]} />
      <instancedMesh ref={orb} args={[orbGeometry, orbMaterial, ids.length]} />
    </group>
  )
}

export function BossBattleEffects() {
  const meteorRoster = useSessionStore(useShallow((state) => state.meteors.map((meteor) => `${meteor.id}|${meteor.kind}`)))
  const fireMeteorIds = useMemo(() => meteorRoster
    .filter((entry) => entry.endsWith('|fire'))
    .map((entry) => entry.slice(0, -5)), [meteorRoster])
  const shadowMeteorIds = useMemo(() => meteorRoster
    .filter((entry) => entry.endsWith('|shadow'))
    .map((entry) => entry.slice(0, -7)), [meteorRoster])
  const shadowBossId = useSessionStore((state) => state.enemies.find((enemy) => enemy.bossType === 'shadow' && enemy.animation !== 'dead')?.id ?? null)
  const akuBossId = useSessionStore((state) => state.enemies.find((enemy) => enemy.bossType === 'aku' && enemy.animation !== 'dead')?.id ?? null)
  const shadowRing = useRef<Group>(null)
  const akuSpikeField = useRef<Group>(null)
  useFrame((_, delta) => {
    const enemies = useSessionStore.getState().enemies
    const shadow = enemies.find((enemy) => enemy.id === shadowBossId)
    const aku = enemies.find((enemy) => enemy.id === akuBossId)
    if (shadowRing.current) {
      shadowRing.current.visible = shadow?.special === 'meteor'
      if (shadow) shadowRing.current.position.x = shadow.x
      shadowRing.current.rotation.y += delta * 0.42
    }
    if (akuSpikeField.current) {
      akuSpikeField.current.visible = aku?.special === 'aku-fire-rain'
      if (aku) akuSpikeField.current.position.x = aku.x
      akuSpikeField.current.rotation.y -= delta * 0.58
      const pulse = 1 + Math.sin(performance.now() * 0.01) * 0.035
      akuSpikeField.current.scale.set(pulse, 1, pulse)
    }
  })
  return (
    <>
      <InstancedMeteorField ids={fireMeteorIds} kind="fire" />
      <InstancedMeteorField ids={shadowMeteorIds} kind="shadow" />
      <group ref={shadowRing} visible={false}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.09, 0]}><torusGeometry args={[2.72, 0.08, 7, 64]} /><meshStandardMaterial color="#190006" emissive="#ff0c31" emissiveIntensity={1.7} /></mesh>
        <InstancedSpikeField color="#210008" emissive="#c7092e" emissiveIntensity={0.8} height={0.76} instances={SHADOW_SPIKE_INSTANCES} radius={0.13} y={0.38} />
      </group>
      <group ref={akuSpikeField} visible={false} name="aku-ates-yagmuru-diken-alani">
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
          <circleGeometry args={[AKU_FIRE_SPIKE_RADIUS, 64]} />
          <meshBasicMaterial color="#ff3f0f" transparent opacity={0.13} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
          <torusGeometry args={[AKU_FIRE_SPIKE_RADIUS * 0.96, 0.11, 7, 72]} />
          <meshStandardMaterial color="#160803" emissive="#ff4b18" emissiveIntensity={2.4} />
        </mesh>
        <InstancedSpikeField color="#140604" emissive="#ff4b17" emissiveIntensity={1.65} height={1.18} instances={AKU_TALL_SPIKES} radius={0.2} roughness={0.46} y={0.52} />
        <InstancedSpikeField color="#140604" emissive="#8fff38" emissiveIntensity={1.65} height={0.88} instances={AKU_SHORT_SPIKES} radius={0.15} roughness={0.46} y={0.52} />
      </group>
    </>
  )
}
