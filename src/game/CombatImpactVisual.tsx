import { useLayoutEffect, useRef } from 'react'
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  OctahedronGeometry,
  SphereGeometry,
  TetrahedronGeometry,
  TorusGeometry,
} from 'three'
import type { ImpactKind } from '../types/session'
import { COMBAT_EFFECT_STYLE } from './combatEffectConfig'
import { TimeSpiralDisc } from './TimeSpiralDisc'

const IMPACT_KINDS = Object.keys(COMBAT_EFFECT_STYLE) as ImpactKind[]
const IMPACT_SPHERE_GEOMETRY = new SphereGeometry(0.28, 8, 6)
const IMPACT_RING_GEOMETRY = new TorusGeometry(0.72, 0.06, 6, 32)
const IMPACT_RING_SPHERE_GEOMETRY = new SphereGeometry(0.34, 12, 8)
const PORTAL_RING_GEOMETRY = new TorusGeometry(0.91, 0.055, 8, 56)
const BURST_GEOMETRIES = {
  shard: new TetrahedronGeometry(0.23, 0),
  spark: new OctahedronGeometry(0.13, 0),
}
const BURST_MATERIAL = new MeshBasicMaterial({ side: DoubleSide, toneMapped: false })
const IMPACT_COLORS = Object.fromEntries(IMPACT_KINDS.map((kind) => [kind, {
  primary: new Color(COMBAT_EFFECT_STYLE[kind].primary),
  secondary: new Color(COMBAT_EFFECT_STYLE[kind].secondary),
}])) as Record<ImpactKind, { primary: Color; secondary: Color }>
const SPHERE_MATERIALS = Object.fromEntries(IMPACT_KINDS.map((kind) => [kind, new MeshBasicMaterial({
  blending: AdditiveBlending,
  color: COMBAT_EFFECT_STYLE[kind].secondary,
  depthWrite: false,
  opacity: 0.28,
  side: DoubleSide,
  toneMapped: false,
  transparent: true,
})])) as Record<ImpactKind, MeshBasicMaterial>
const RING_MATERIALS = Object.fromEntries(IMPACT_KINDS.map((kind) => [kind, {
  primary: new MeshBasicMaterial({
    blending: AdditiveBlending,
    color: COMBAT_EFFECT_STYLE[kind].primary,
    depthWrite: false,
    opacity: 0.82,
    side: DoubleSide,
    transparent: true,
  }),
  secondary: new MeshBasicMaterial({
    color: COMBAT_EFFECT_STYLE[kind].secondary,
    opacity: 0.45,
    side: DoubleSide,
    transparent: true,
    wireframe: true,
  }),
}])) as Record<ImpactKind, { primary: MeshBasicMaterial; secondary: MeshBasicMaterial }>
const PORTAL_RING_MATERIAL = new MeshBasicMaterial({
  blending: AdditiveBlending,
  color: '#70e8ff',
  depthWrite: false,
  opacity: 0.82,
  side: DoubleSide,
  toneMapped: false,
  transparent: true,
})

function createBurstMatrices(shard: boolean) {
  const count = shard ? 8 : 11
  const dummy = new Object3D()
  return Array.from({ length: count }, (_, index) => {
    const angle = index / count * Math.PI * 2
    dummy.position.set(Math.cos(angle) * 0.55, Math.sin(angle * 2) * 0.35 + 0.3, Math.sin(angle) * 0.42)
    dummy.rotation.set(angle, angle * 0.7, -angle)
    dummy.updateMatrix()
    return dummy.matrix.clone()
  })
}

const BURST_MATRICES = {
  shard: createBurstMatrices(true),
  spark: createBurstMatrices(false),
}

function ImpactBurst({ kind }: { kind: ImpactKind }) {
  const style = COMBAT_EFFECT_STYLE[kind]
  const shape = style.shape === 'shard' ? 'shard' : 'spark'
  const matrices = BURST_MATRICES[shape]
  const mesh = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const instance = mesh.current
    if (!instance) return
    const colors = IMPACT_COLORS[kind]
    for (let index = 0; index < matrices.length; index += 1) {
      instance.setMatrixAt(index, matrices[index])
      instance.setColorAt(index, index % 2 ? colors.primary : colors.secondary)
    }
    instance.instanceMatrix.needsUpdate = true
    if (instance.instanceColor) instance.instanceColor.needsUpdate = true
  }, [kind, matrices])

  return <instancedMesh ref={mesh} args={[BURST_GEOMETRIES[shape], BURST_MATERIAL, matrices.length]} dispose={null} frustumCulled={false} />
}

export function CombatImpactVisual({ kind, lethal = false }: { kind: ImpactKind; lethal?: boolean }) {
  const style = COMBAT_EFFECT_STYLE[kind]
  return (
    <>
      <mesh geometry={IMPACT_SPHERE_GEOMETRY} material={SPHERE_MATERIALS[kind]} scale={lethal ? 1.35 : 1} dispose={null} />
      {kind === 'portal' ? (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <TimeSpiralDisc radius={0.86} opacity={0.96} speed={8.2} />
          <mesh geometry={PORTAL_RING_GEOMETRY} material={PORTAL_RING_MATERIAL} position={[0, 0, 0.025]} dispose={null} />
        </group>
      ) : style.shape === 'ring' ? (
        <>
          <mesh geometry={IMPACT_RING_GEOMETRY} material={RING_MATERIALS[kind].primary} rotation={[Math.PI / 2, 0, 0]} dispose={null} />
          <mesh geometry={IMPACT_RING_SPHERE_GEOMETRY} material={RING_MATERIALS[kind].secondary} dispose={null} />
        </>
      ) : <ImpactBurst kind={kind} />}
    </>
  )
}
