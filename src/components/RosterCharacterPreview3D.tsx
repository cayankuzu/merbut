import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { Group, LoopRepeat, MathUtils } from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { AnimatedCharacter } from '../characters/AnimatedCharacter'
import { ASSET_PATHS } from '../config/assetPaths'
import type { RosterPreview } from '../config/characterRoster'
import { ENEMIES } from '../config/enemies'
import { CHARACTERS } from '../config/gameConfig'

function AnimatedAsset({ source, scale = 1.5 }: { source: string; scale?: number }) {
  const file = useGLTF(source)
  const scene = useMemo(() => SkeletonUtils.clone(file.scene), [file.scene])
  const { actions } = useAnimations(file.animations, scene)
  useEffect(() => {
    const action = Object.values(actions)[0]
    action?.reset().setLoop(LoopRepeat, Infinity).play()
    return () => { action?.stop() }
  }, [actions])
  return <primitive object={scene} scale={scale} />
}

function PreviewModel({ preview }: { preview: RosterPreview }) {
  if (preview.type === 'hero') return <group position={[0, -1.32, 0]}><AnimatedCharacter definition={CHARACTERS[preview.id]} animationState="walk" /></group>
  if (preview.type === 'enemy') return <group position={[0, -1.28, 0]}><AnimatedAsset source={ENEMIES[preview.kind].walk} scale={ENEMIES[preview.kind].scale} /></group>
  if (preview.type === 'shadow') return <group position={[0, -1.3, 0]}><AnimatedAsset source={ASSET_PATHS.bosses.evilJack.walk} scale={2.35} /></group>
  const source = preview.form === 'normal' ? ASSET_PATHS.bosses.aku.normal.walk : ASSET_PATHS.bosses.aku.monster.idle
  return <group position={[0, -1.25, 0]}><AnimatedAsset source={source} scale={3.05} /></group>
}

function RotatableRosterModel({ preview, rotation }: { preview: RosterPreview; rotation: number }) {
  const root = useRef<Group>(null)
  useFrame(({ clock }, delta) => {
    if (!root.current) return
    root.current.rotation.y = MathUtils.damp(root.current.rotation.y, rotation, 12, delta)
    root.current.position.y = Math.sin(clock.elapsedTime * 1.5) * 0.025
  })
  return <group ref={root} rotation={[0, rotation, 0]}><PreviewModel preview={preview} /></group>
}

function getPreviewCamera(preview: RosterPreview) {
  if (preview.type === 'hero') return { distance: 5.5, height: 1.25 }
  if (preview.type === 'enemy') return { distance: 5.25, height: 1.2 }
  if (preview.type === 'shadow') return { distance: 7.2, height: 1.4 }
  return preview.form === 'monster'
    ? { distance: 11.4, height: 1.75 }
    : { distance: 9, height: 1.55 }
}

function PreviewCamera({ distance, height, pan, zoom }: { distance: number; height: number; pan: readonly [number, number]; zoom: number }) {
  const camera = useThree((state) => state.camera)
  useFrame((_, delta) => {
    camera.position.x = MathUtils.damp(camera.position.x, pan[0], 9, delta)
    camera.position.z = MathUtils.damp(camera.position.z, distance / zoom, 9, delta)
    camera.position.y = MathUtils.damp(camera.position.y, height + pan[1], 9, delta)
    camera.updateProjectionMatrix()
  })
  return null
}

interface RosterCharacterPreview3DProps {
  label: string
  pan: readonly [number, number]
  preview: RosterPreview
  rotation: number
  zoom: number
}

export function RosterCharacterPreview3D({ preview, rotation, pan, zoom, label }: RosterCharacterPreview3DProps) {
  const camera = getPreviewCamera(preview)
  return (
    <div className="roster-model" aria-label={`${label} döndürülebilir 3B modeli`}>
      <Canvas dpr={[0.8, 1.1]} camera={{ position: [0, camera.height, camera.distance], fov: 34 }} gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[4, 6, 4]} intensity={3.5} color="#fff0d6" />
        <pointLight position={[-3, 1.5, 2]} intensity={3} color="#ff3d73" />
        <PreviewCamera distance={camera.distance} height={camera.height} pan={pan} zoom={zoom} />
        <Suspense fallback={null}><RotatableRosterModel preview={preview} rotation={rotation} /></Suspense>
      </Canvas>
    </div>
  )
}
