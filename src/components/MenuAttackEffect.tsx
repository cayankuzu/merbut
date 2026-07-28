import { useEffect, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, DoubleSide, Group, MathUtils, Mesh, MeshBasicMaterial } from 'three'
import { AliFlameTrailVisual } from '../game/AliFlameTrailVisual'
import { FireballVisual } from '../game/FireballVisual'
import { ALI_FLAME_ARCS, JACK_SLASHES } from '../game/heroCombatGeometry'
import { JackShieldVisual } from '../game/JackShieldVisual'
import { JackSlashVisual } from '../game/JackSlashVisual'
import { CombatImpactVisual } from '../game/CombatImpactVisual'
import { EnemyProjectileVisual } from '../game/EnemyProjectileVisual'
import type { EnemyProjectileState, ImpactKind } from '../types/session'

export type MenuAttackEffectKind =
  | 'none'
  | 'slash'
  | 'projectile'
  | 'shockwave'
  | 'flame'
  | 'ali-slash'
  | 'ali-fireball'
  | 'jack-slash'
  | 'jack-shield'
  | 'impact-ember'
  | 'impact-void'
  | 'impact-quake'
  | 'impact-boss'
  | 'projectile-stone'
  | 'projectile-dark-orb'
  | 'projectile-aku-fire'

interface MenuAttackEffectProps {
  accent: string
  direction: -1 | 1
  kind: MenuAttackEffectKind
  originY: number
  /** Live model-derived origin used by the menu showcase without re-rendering. */
  originYRef?: MutableRefObject<number>
  presentationScale?: number
  trigger: number
  variant: number
}

export function MenuAttackEffect({ accent, direction, kind, originY, originYRef, presentationScale = 1, trigger, variant }: MenuAttackEffectProps) {
  const root = useRef<Group>(null)
  const aliArcs = useRef<Mesh[]>([])
  const aliMaterials = useRef<MeshBasicMaterial[]>([])
  const jackMeshes = useRef<Mesh[]>([])
  const jackMaterials = useRef<MeshBasicMaterial[]>([])
  const elapsed = useRef(Number.POSITIVE_INFINITY)
  const impactKind = kind.startsWith('impact-') ? kind.slice('impact-'.length) as ImpactKind : null
  const projectileKind = kind.startsWith('projectile-')
    ? kind.slice('projectile-'.length) as EnemyProjectileState['kind']
    : null

  useEffect(() => {
    if (trigger === 0) return
    elapsed.current = 0
    if (root.current) root.current.visible = true
  }, [trigger])

  useFrame((_, delta) => {
    const group = root.current
    if (!group) return
    const effectOriginY = originYRef?.current ?? originY

    elapsed.current += delta
    const duration = kind === 'ali-slash' || kind === 'jack-slash'
      ? 1
      : kind === 'projectile' || kind === 'ali-fireball'
        ? 0.92
        : kind === 'jack-shield'
          ? 1.05
          : 0.72
    const progress = elapsed.current / duration
    if (progress >= 1) {
      group.visible = false
      return
    }

    const eased = 1 - (1 - progress) ** 3
    if (kind === 'ali-slash') {
      group.position.set(direction * 1.3, effectOriginY, 0.15)
      group.rotation.set(0, direction < 0 ? Math.PI : 0, 0)
      group.scale.setScalar(presentationScale)
      const envelope = Math.sin(Math.PI * Math.min(1, progress * 1.12))
      aliArcs.current.forEach((arc, index) => {
        arc.scale.setScalar(ALI_FLAME_ARCS[index]!.scale * (0.72 + progress * 0.66))
        arc.position.y = ALI_FLAME_ARCS[index]!.position[1] + progress * 0.22
        if (aliMaterials.current[index]) aliMaterials.current[index]!.opacity = envelope * (0.9 - index * 0.13)
      })
      return
    }
    if (kind === 'jack-slash') {
      group.position.set(direction * 1.5, effectOriginY, 0.18)
      group.rotation.set(0, direction < 0 ? Math.PI : 0, 0)
      group.scale.setScalar((0.78 + progress * 0.48) * presentationScale)
      const reveal = Math.min(1, progress / 0.14)
      const opacity = reveal * Math.pow(1 - progress, 1.7)
      JACK_SLASHES.forEach((_, index) => {
        if (jackMaterials.current[index]) jackMaterials.current[index]!.opacity = opacity * (1 - index * 0.19)
        if (jackMeshes.current[index]) jackMeshes.current[index]!.position.x = (index - 1) * 0.16 + progress * 0.28
      })
      return
    }
    if (kind === 'ali-fireball') {
      group.position.set(direction * (1.15 + eased * 1.7), effectOriginY + Math.sin(progress * Math.PI) * 0.06, 0.15)
      group.rotation.set(0, 0, 0)
      group.scale.setScalar(presentationScale)
      return
    }
    if (kind === 'jack-shield') {
      group.position.set(0, effectOriginY, 0)
      group.rotation.y += delta * 0.72
      group.rotation.z = 0
      group.scale.setScalar(presentationScale)
      return
    }
    if (impactKind) {
      group.position.set(direction * 0.9, effectOriginY, 0.15)
      group.rotation.y += delta * 3.2
      group.rotation.z -= delta * 1.7
      group.scale.setScalar((0.35 + progress * 1.45) * Math.sin(Math.PI * Math.min(1, progress + 0.08)) * presentationScale)
      return
    }
    if (projectileKind) {
      group.position.set(direction * (0.62 + eased * 1.7), effectOriginY + Math.sin(progress * Math.PI) * 0.12, 0.2)
      group.rotation.set(progress * 2.2, progress, progress * 1.4)
      group.scale.setScalar(presentationScale)
      return
    }

    const travel = kind === 'projectile' ? 1.7 : kind === 'slash' ? 0.72 : 0.38
    group.position.set(direction * (0.42 + eased * travel), effectOriginY + Math.sin(progress * Math.PI) * 0.16, 0.72)
    group.rotation.z = direction * ((variant - 1) * 0.22 + progress * 0.18)
    const pulse = Math.sin(Math.min(1, progress * 1.4) * Math.PI)
    const scale = kind === 'shockwave' ? 0.38 + eased * 1.55 : 0.52 + pulse * 0.72
    group.scale.setScalar(scale * 0.74 * presentationScale)

    const opacity = MathUtils.clamp((1 - progress) * 1.45, 0, 0.92)
    group.traverse((node) => {
      if (!(node as Mesh).isMesh) return
      const material = (node as Mesh).material
      if (material instanceof MeshBasicMaterial) material.opacity = opacity
    })
  })

  const slashEffect = (
    <>
      <mesh rotation={[0, 0, direction * 0.48]}>
        <planeGeometry args={[1.55, 0.085]} />
        <meshBasicMaterial color="#fff4d2" transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh rotation={[0, 0, direction * -0.38]}>
        <planeGeometry args={[1.1, 0.055]} />
        <meshBasicMaterial color={accent} transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh scale={[1.2, 0.72, 1]}>
        <ringGeometry args={[0.72, 0.82, 40, 1, 0.2, Math.PI * 1.22]} />
        <meshBasicMaterial color={accent} transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </>
  )

  const projectileEffect = (
    <>
      <mesh>
        <sphereGeometry args={[0.18, 16, 12]} />
        <meshBasicMaterial color="#fff8de" transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh scale={[1.5, 1.5, 1]}>
        <ringGeometry args={[0.2, 0.27, 28]} />
        <meshBasicMaterial color={accent} transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      {[-0.48, -0.3, -0.14].map((offset, index) => (
        <mesh key={offset} position={[direction * offset, (index - 1) * 0.09, -0.02]} scale={1 - index * 0.2}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshBasicMaterial color={accent} transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </>
  )

  const shockwaveEffect = (
    <>
      <mesh>
        <ringGeometry args={[0.58, 0.68, 48]} />
        <meshBasicMaterial color={accent} transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[1.25, 0.05]} />
        <meshBasicMaterial color="#fff1c4" transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 4]}>
        <planeGeometry args={[1.25, 0.05]} />
        <meshBasicMaterial color={accent} transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </>
  )

  const flameEffect = (
    <>
      {[0, 1, 2, 3, 4].map((index) => (
        <mesh key={index} position={[direction * (index * 0.16), Math.sin(index * 2.1) * 0.16, index * -0.035]} scale={1 - index * 0.1}>
          <octahedronGeometry args={[0.22, 0]} />
          <meshBasicMaterial color={index % 2 === 0 ? '#fff1a8' : accent} transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
      <mesh scale={[1.7, 0.75, 1]}>
        <ringGeometry args={[0.35, 0.46, 32]} />
        <meshBasicMaterial color={accent} transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </>
  )

  return (
    <group ref={root} visible={false}>
      {kind === 'ali-slash' ? <AliFlameTrailVisual arcs={aliArcs} materials={aliMaterials} /> : null}
      {kind === 'ali-fireball' ? <FireballVisual directionX={direction} /> : null}
      {kind === 'jack-slash' ? <JackSlashVisual meshes={jackMeshes} materials={jackMaterials} /> : null}
      {kind === 'jack-shield' ? <JackShieldVisual /> : null}
      {impactKind ? <CombatImpactVisual kind={impactKind} /> : null}
      {projectileKind ? <EnemyProjectileVisual kind={projectileKind} /> : null}
      {kind === 'slash' ? slashEffect : kind === 'projectile' ? projectileEffect : kind === 'shockwave' ? shockwaveEffect : kind === 'flame' ? flameEffect : null}
    </group>
  )
}
