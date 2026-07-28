import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { Box3, Group, LoopRepeat, MathUtils, PerspectiveCamera, SkinnedMesh, Vector3 } from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { AnimatedCharacter } from '../characters/AnimatedCharacter'
import { EvilJackCharacter } from '../characters/EvilJackCharacter'
import { prepareAnimationClip } from '../animation/animationLoader'
import { validateClipTargets } from '../animation/animationRetargeting'
import { ASSET_PATHS } from '../config/assetPaths'
import { BOSS_MODEL_SCALES } from '../config/characterTransforms'
import type { RosterPreview } from '../config/characterRoster'
import { ENEMIES } from '../config/enemies'
import { CHARACTERS } from '../config/gameConfig'
import { computeRosterPreviewFit, getRosterPreviewDistance, type RosterPreviewFit } from './rosterPreviewFit'

const FIT_SAMPLE_DELAYS = [0, 0.32, 0.74] as const
const CAMERA_PADDING = 1.12

interface RosterFitState extends RosterPreviewFit {
  ready: boolean
}

function LocomotionAsset({ animationSource, modelSource, scale = 1.5 }: { animationSource?: string; modelSource: string; scale?: number }) {
  const modelFile = useGLTF(modelSource)
  const animationFile = useGLTF(animationSource ?? modelSource)
  const scene = useMemo(() => SkeletonUtils.clone(modelFile.scene), [modelFile.scene])
  const clip = useMemo(
    () => validateClipTargets(scene, prepareAnimationClip(animationFile.animations[0], 'walk')),
    [animationFile.animations, scene],
  )
  const { actions } = useAnimations([clip], scene)
  useEffect(() => {
    const action = actions.walk
    action?.reset().setLoop(LoopRepeat, Infinity).play()
    return () => { action?.stop() }
  }, [actions])
  return <primitive object={scene} scale={scale} />
}

function PreviewModel({ preview }: { preview: RosterPreview }) {
  if (preview.type === 'hero') return <AnimatedCharacter definition={CHARACTERS[preview.id]} animationState="walk" />
  if (preview.type === 'enemy') return <LocomotionAsset modelSource={ENEMIES[preview.kind].walk} scale={ENEMIES[preview.kind].scale} />
  if (preview.type === 'shadow') return <group scale={BOSS_MODEL_SCALES.shadow}><EvilJackCharacter action="walk" loopCombat shadows={false} /></group>
  if (preview.form === 'normal') return <LocomotionAsset modelSource={ASSET_PATHS.bosses.aku.normal.walk} scale={BOSS_MODEL_SCALES.aku} />
  return <LocomotionAsset animationSource={ASSET_PATHS.bosses.aku.monster.walk} modelSource={ASSET_PATHS.bosses.aku.monster.idle} scale={BOSS_MODEL_SCALES.aku} />
}

function refreshAnimatedBounds(root: Group) {
  root.traverse((node) => {
    if (node instanceof SkinnedMesh) node.computeBoundingBox()
  })
}

function RotatableRosterModel({ fit, preview, rotation }: { fit: MutableRefObject<RosterFitState>; preview: RosterPreview; rotation: number }) {
  const root = useRef<Group>(null)
  const content = useRef<Group>(null)
  const envelope = useRef(new Box3())
  const sample = useRef(new Box3())
  const sampleIndex = useRef(0)
  const mountedAt = useRef<number | null>(null)

  useFrame(({ clock }, delta) => {
    const modelRoot = root.current
    const modelContent = content.current
    if (!modelRoot || !modelContent) return

    modelRoot.rotation.y = MathUtils.damp(modelRoot.rotation.y, rotation, 12, delta)
    modelRoot.position.y = Math.sin(clock.elapsedTime * 1.5) * 0.025

    mountedAt.current ??= clock.elapsedTime
    const nextDelay = FIT_SAMPLE_DELAYS[sampleIndex.current]
    if (nextDelay === undefined || clock.elapsedTime - mountedAt.current < nextDelay) return

    const renderedRotation = modelRoot.rotation.y
    const renderedHeight = modelRoot.position.y
    const renderedContentPosition = modelContent.position.clone()
    modelRoot.rotation.y = 0
    modelRoot.position.y = 0
    modelContent.position.set(0, 0, 0)
    modelRoot.updateWorldMatrix(true, true)
    refreshAnimatedBounds(modelContent)
    sample.current.setFromObject(modelContent)

    if (!sample.current.isEmpty()) {
      envelope.current.union(sample.current)
      const nextFit = computeRosterPreviewFit(envelope.current)
      fit.current.center = nextFit.center
      fit.current.halfHeight = nextFit.halfHeight
      fit.current.horizontalRadius = nextFit.horizontalRadius
      fit.current.modelOffset = nextFit.modelOffset
      fit.current.ready = true
    }

    modelContent.position.set(...(fit.current.ready ? fit.current.modelOffset : renderedContentPosition.toArray()))
    modelRoot.rotation.y = renderedRotation
    modelRoot.position.y = renderedHeight
    modelRoot.updateWorldMatrix(true, true)
    sampleIndex.current += 1
  })
  return <group ref={root} rotation={[0, rotation, 0]}><group ref={content}><PreviewModel preview={preview} /></group></group>
}

function PreviewCamera({ fit, pan, zoom }: { fit: MutableRefObject<RosterFitState>; pan: readonly [number, number]; zoom: number }) {
  const camera = useThree((state) => state.camera)
  const target = useRef(new Vector3(0, 1.25, 0))
  useFrame((_, delta) => {
    if (!(camera instanceof PerspectiveCamera)) return
    const center = fit.current.center
    const targetX = center[0] + pan[0]
    const targetY = center[1] + pan[1]
    const targetZ = center[2]
    const distance = getRosterPreviewDistance(fit.current, camera.fov, camera.aspect, CAMERA_PADDING) / zoom

    target.current.x = MathUtils.damp(target.current.x, targetX, 10, delta)
    target.current.y = MathUtils.damp(target.current.y, targetY, 10, delta)
    target.current.z = MathUtils.damp(target.current.z, targetZ, 10, delta)
    camera.position.x = MathUtils.damp(camera.position.x, targetX, 10, delta)
    camera.position.y = MathUtils.damp(camera.position.y, targetY, 10, delta)
    camera.position.z = MathUtils.damp(camera.position.z, targetZ + distance, fit.current.ready ? 9 : 14, delta)
    camera.lookAt(target.current)
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
  const fit = useRef<RosterFitState>({
    center: [0, 1.25, 0],
    halfHeight: 1.5,
    horizontalRadius: 1.1,
    modelOffset: [0, 0, 0],
    ready: false,
  })
  return (
    <div className="roster-model" aria-label={`${label} döndürülebilir 3B modeli`}>
      <Canvas dpr={[0.8, 1.1]} camera={{ position: [0, 1.25, 8], fov: 34 }} gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[4, 6, 4]} intensity={3.5} color="#fff0d6" />
        <pointLight position={[-3, 1.5, 2]} intensity={3} color="#ff3d73" />
        <PreviewCamera fit={fit} pan={pan} zoom={zoom} />
        <Suspense fallback={null}><RotatableRosterModel fit={fit} preview={preview} rotation={rotation} /></Suspense>
      </Canvas>
    </div>
  )
}
