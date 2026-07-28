import { useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Group, Mesh, MeshStandardMaterial, Object3D } from 'three'
import { ASSET_PATHS } from '../config/assetPaths'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'

function createPurpleBottle(source: Object3D) {
  const clone = source.clone(true)
  clone.traverse((node) => {
    if (!(node instanceof Mesh)) return
    const sourceMaterial = Array.isArray(node.material) ? node.material[0] : node.material
    const material = sourceMaterial?.clone() as MeshStandardMaterial | undefined
    if (!material) return
    material.color.set('#7f48b8')
    material.emissive.set('#a32cff')
    material.emissiveIntensity = 0.55
    node.material = material
  })
  return clone
}

export function BossIntroSequence() {
  const file = useGLTF(ASSET_PATHS.items.zemzem)
  const aliBottle = useMemo(() => createPurpleBottle(file.scene), [file.scene])
  const jackBottle = useMemo(() => createPurpleBottle(file.scene), [file.scene])
  const aliRoot = useRef<Group>(null)
  const jackRoot = useRef<Group>(null)
  const phase = useSessionStore((state) => state.phase)
  const bossPhase = useSessionStore((state) => state.bossPhase)
  const phaseStartedAt = useSessionStore((state) => state.bossPhaseStartedAt)

  useFrame((_, delta) => {
    if (!aliRoot.current || !jackRoot.current) return
    const game = useGameStore.getState()
    const now = performance.now()
    const drinkingProgress = bossPhase === 'drinking' ? Math.min(1, Math.max(0, (now - phaseStartedAt - 1_350) / 1_250)) : 0
    const midpoint = (game.positions.ali[0] + game.positions.jack[0]) / 2
    const targets = [
      { root: aliRoot.current, playerX: game.positions.ali[0], groundX: midpoint - 0.72 },
      { root: jackRoot.current, playerX: game.positions.jack[0], groundX: midpoint + 0.72 },
    ]
    targets.forEach(({ root, playerX, groundX }, index) => {
      const x = bossPhase === 'drinking' ? groundX + (playerX - groundX) * drinkingProgress : groundX
      const y = bossPhase === 'drinking' ? 0.58 + Math.sin(drinkingProgress * Math.PI) * 1.22 : 0.58
      root.position.set(x, y, index === 0 ? 0.12 : -0.12)
      root.rotation.y += delta * 2.1
      root.rotation.z = bossPhase === 'drinking' ? drinkingProgress * (index === 0 ? -0.72 : 0.72) : 0
      root.visible = phase === 'boss-intro' && (bossPhase === 'offering' || bossPhase === 'drinking')
    })
  })

  return (
    <>
      <group ref={aliRoot} visible={false}><primitive object={aliBottle} scale={0.42} /><mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.48, 0]}><torusGeometry args={[0.5, 0.045, 8, 36]} /><meshBasicMaterial color="#d971ff" transparent opacity={0.8} toneMapped={false} /></mesh></group>
      <group ref={jackRoot} visible={false}><primitive object={jackBottle} scale={0.42} /><mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.48, 0]}><torusGeometry args={[0.5, 0.045, 8, 36]} /><meshBasicMaterial color="#d971ff" transparent opacity={0.8} toneMapped={false} /></mesh></group>
    </>
  )
}
