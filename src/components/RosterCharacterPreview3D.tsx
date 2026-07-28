import {
  Suspense,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import {
  AnimationMixer,
  Bone,
  Box3,
  Group,
  LoopOnce,
  PerspectiveCamera,
  SkinnedMesh,
  Vector3,
  type AnimationClip,
  type Object3D,
} from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { prepareAnimationClip } from '../animation/animationLoader'
import { validateClipTargets } from '../animation/animationRetargeting'
import { AliFaceLight } from '../characters/AliFaceLight'
import {
  alignWeaponAttachment,
  attachWeapon,
  placeWeaponGripInPalm,
  updateWeaponSocket,
  type WeaponAttachment,
} from '../characters/WeaponSocket'
import { findShadowTorsoBone, updateShadowWeaponSocket } from '../characters/shadowWeapon'
import { ASSET_PATHS } from '../config/assetPaths'
import { SHADOW_WEAPON_TRANSFORM } from '../config/characterTransforms'
import type { RosterPreview } from '../config/characterRoster'
import { CHARACTERS } from '../config/gameConfig'
import { useDebugStore } from '../store/debugStore'
import { PERFORMANCE_PROFILES, usePerformanceStore } from '../store/performanceStore'
import type { CharacterId } from '../types/character'
import type { GalleryRotation } from './characterGalleryRotation'
import {
  computeRosterPreviewFit,
  getRosterPreviewDistance,
  ROSTER_CAMERA_PADDING,
  type RosterPreviewFit,
} from './rosterPreviewFit'
import { getRosterPoseSpec } from './rosterPreviewPose'

const ALI_PALM_REACH = 0.48

/** Samples a natural non-T-pose once, then leaves every bone completely still. */
function useFrozenPose(
  root: Object3D,
  source: AnimationClip | undefined,
  fraction: number,
) {
  const clip = useMemo(
    () => validateClipTargets(root, prepareAnimationClip(source, 'gallery-static-pose')),
    [root, source],
  )

  useLayoutEffect(() => {
    const mixer = new AnimationMixer(root)
    const action = mixer.clipAction(clip)
    action.enabled = true
    action.clampWhenFinished = true
    action.setLoop(LoopOnce, 1).reset().play()
    mixer.setTime(Math.max(0, clip.duration * fraction))
    action.paused = true
    root.updateWorldMatrix(true, true)

    return () => {
      action.stop()
      mixer.uncacheRoot(root)
    }
  }, [clip, fraction, root])
}

function StaticHeroPose({
  id,
  onReady,
  poseFraction,
}: {
  id: CharacterId
  onReady: () => void
  poseFraction: number
}) {
  const definition = CHARACTERS[id]
  const idleFile = useGLTF(definition.assets.idle)
  const swordFile = useGLTF(definition.assets.sword)
  const transform = useDebugStore((state) => state.transforms[id])
  const initialWeaponTransform = useRef(transform.weapon)
  const attachment = useRef<WeaponAttachment | null>(null)
  const characterScene = useMemo(() => SkeletonUtils.clone(idleFile.scene), [idleFile.scene])
  const swordScene = useMemo(() => swordFile.scene.clone(true), [swordFile.scene])

  useFrozenPose(characterScene, idleFile.animations[0], poseFraction)

  useLayoutEffect(() => {
    const nextAttachment = attachWeapon(characterScene, swordScene, initialWeaponTransform.current)
    updateWeaponSocket(nextAttachment, true, 1)
    if (id === 'ali') placeWeaponGripInPalm(nextAttachment, ALI_PALM_REACH)
    attachment.current = nextAttachment
    characterScene.updateWorldMatrix(true, true)
    onReady()
    return () => {
      nextAttachment.detach()
      attachment.current = null
    }
  }, [characterScene, id, onReady, swordScene])

  useLayoutEffect(() => {
    if (!attachment.current) return
    alignWeaponAttachment(attachment.current, transform.weapon)
    updateWeaponSocket(attachment.current, true, 1)
    if (id === 'ali') placeWeaponGripInPalm(attachment.current, ALI_PALM_REACH)
    characterScene.updateWorldMatrix(true, true)
  }, [characterScene, id, transform.weapon])

  return (
    <group
      name={`${id}-gallery-static-pose`}
      position={transform.modelPosition}
      rotation={transform.modelRotation}
      scale={transform.modelScale}
    >
      <primitive object={characterScene} />
      {id === 'ali' ? <AliFaceLight scene={characterScene} /> : null}
    </group>
  )
}

function StaticShadowPose({
  onReady,
  poseFraction,
  scale,
}: {
  onReady: () => void
  poseFraction: number
  scale: number
}) {
  const modelFile = useGLTF(ASSET_PATHS.bosses.evilJack.walk)
  const swordFile = useGLTF(ASSET_PATHS.jack.sword)
  const attachment = useRef<WeaponAttachment | null>(null)
  const scene = useMemo(() => SkeletonUtils.clone(modelFile.scene), [modelFile.scene])
  const sword = useMemo(() => swordFile.scene.clone(true), [swordFile.scene])
  const torso = useMemo(() => findShadowTorsoBone(scene), [scene])

  useFrozenPose(scene, modelFile.animations[0], poseFraction)

  useLayoutEffect(() => {
    const nextAttachment = attachWeapon(scene, sword, SHADOW_WEAPON_TRANSFORM)
    updateShadowWeaponSocket(nextAttachment, torso, true, 1)
    attachment.current = nextAttachment
    scene.updateWorldMatrix(true, true)
    onReady()
    return () => {
      nextAttachment.detach()
      attachment.current = null
    }
  }, [onReady, scene, sword, torso])

  return <primitive object={scene} scale={scale} />
}

function StaticPoseAsset({
  modelSource,
  onReady,
  poseFraction,
  poseSource,
  scale,
}: {
  modelSource: string
  onReady: () => void
  poseFraction: number
  poseSource: string
  scale: number
}) {
  const modelFile = useGLTF(modelSource)
  const poseFile = useGLTF(poseSource)
  const scene = useMemo(() => SkeletonUtils.clone(modelFile.scene), [modelFile.scene])
  useFrozenPose(scene, poseFile.animations[0], poseFraction)
  useLayoutEffect(() => {
    scene.updateWorldMatrix(true, true)
    onReady()
  }, [onReady, scene])
  return <primitive object={scene} scale={scale} />
}

function PreviewModel({ onReady, preview }: { onReady: () => void; preview: RosterPreview }) {
  const pose = getRosterPoseSpec(preview)
  if (pose.kind === 'hero' && preview.type === 'hero') {
    return <StaticHeroPose id={preview.id} onReady={onReady} poseFraction={pose.poseFraction} />
  }
  if (pose.kind === 'shadow') {
    return <StaticShadowPose onReady={onReady} poseFraction={pose.poseFraction} scale={pose.scale} />
  }
  return (
    <StaticPoseAsset
      modelSource={pose.modelSource}
      onReady={onReady}
      poseSource={pose.poseSource}
      poseFraction={pose.poseFraction}
      scale={pose.scale}
    />
  )
}

function refreshAnimatedBounds(root: Object3D) {
  root.traverse((node) => {
    if (node instanceof SkinnedMesh) {
      node.skeleton.update()
      node.computeBoundingBox()
      const posedBounds = node.boundingBox?.clone()
      node.geometry.computeBoundingBox()
      if (node.geometry.boundingBox) {
        node.boundingBox ??= new Box3()
        node.boundingBox.copy(node.geometry.boundingBox)
        if (posedBounds && !posedBounds.isEmpty()) node.boundingBox.union(posedBounds)
      }
    }
  })
}

function expandBoundsBySkeleton(root: Object3D, bounds: Box3) {
  const skeletonBounds = new Box3()
  const bonePosition = new Vector3()
  root.traverse((node) => {
    if (node instanceof Bone) skeletonBounds.expandByPoint(node.getWorldPosition(bonePosition))
  })
  if (skeletonBounds.isEmpty()) return
  const skeletonSize = skeletonBounds.getSize(new Vector3())
  skeletonBounds.expandByScalar(Math.max(0.08, skeletonSize.length() * 0.08))
  bounds.union(skeletonBounds)
}

function RotatableRosterModel({
  fit,
  onFit,
  preview,
  rotation,
}: {
  fit: RosterPreviewFit
  onFit: Dispatch<SetStateAction<RosterPreviewFit>>
  preview: RosterPreview
  rotation: GalleryRotation
}) {
  const root = useRef<Group>(null)
  const content = useRef<Group>(null)
  const [modelReady, setModelReady] = useState(false)
  const handleModelReady = useCallback(() => setModelReady(true), [])
  const renderedOnce = useRef(false)
  const measured = useRef(false)

  useFrame((state) => {
    if (!modelReady || measured.current) return
    if (!renderedOnce.current) {
      renderedOnce.current = true
      state.invalidate()
      return
    }
    const modelRoot = root.current
    const modelContent = content.current
    if (!modelRoot || !modelContent) return

    const renderedRotation = modelRoot.rotation.clone()
    const renderedContentPosition = modelContent.position.clone()
    modelRoot.rotation.set(0, 0, 0)
    modelContent.position.set(0, 0, 0)
    modelRoot.updateWorldMatrix(true, true)
    refreshAnimatedBounds(modelContent)
    const bounds = new Box3().setFromObject(modelContent)
    expandBoundsBySkeleton(modelContent, bounds)
    const nextFit = computeRosterPreviewFit(bounds)

    modelContent.position.copy(renderedContentPosition)
    modelRoot.rotation.copy(renderedRotation)
    modelRoot.updateWorldMatrix(true, true)
    measured.current = true
    onFit(nextFit)
  })

  return (
    <group ref={root} rotation={[rotation[1], rotation[0], 0]}>
      <group ref={content} position={fit.modelOffset}>
        <PreviewModel onReady={handleModelReady} preview={preview} />
      </group>
    </group>
  )
}

function PreviewCamera({ fit, pan, zoom }: { fit: RosterPreviewFit; pan: readonly [number, number]; zoom: number }) {
  const camera = useThree((state) => state.camera)
  const invalidate = useThree((state) => state.invalidate)

  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return
    const targetX = fit.center[0] + pan[0]
    const targetY = fit.center[1] + pan[1]
    const targetZ = fit.center[2]
    const distance = getRosterPreviewDistance(fit, camera.fov, camera.aspect, ROSTER_CAMERA_PADDING) / zoom
    camera.position.set(targetX, targetY, targetZ + distance)
    camera.lookAt(new Vector3(targetX, targetY, targetZ))
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, fit, invalidate, pan, zoom])
  return null
}

interface RosterCharacterPreview3DProps {
  label: string
  pan: readonly [number, number]
  preview: RosterPreview
  rotation: GalleryRotation
  zoom: number
}

export function RosterCharacterPreview3D({ preview, rotation, pan, zoom, label }: RosterCharacterPreview3DProps) {
  const tier = usePerformanceStore((state) => state.tier)
  const renderDpr = usePerformanceStore((state) => state.renderDpr)
  const profile = PERFORMANCE_PROFILES[tier]
  const [fit, setFit] = useState<RosterPreviewFit>({
    center: [0, 0, 0],
    halfHeight: 1.5,
    horizontalRadius: 1.5,
    modelOffset: [0, 0, 0],
  })

  return (
    <div
      className="roster-model"
      data-static-pose="true"
      data-fit-radius={fit.halfHeight.toFixed(3)}
      data-fit-offset={`${fit.modelOffset[0].toFixed(3)},${fit.modelOffset[1].toFixed(3)},${fit.modelOffset[2].toFixed(3)}`}
      aria-label={`${label} döndürülebilir 3B modeli`}
    >
      <Canvas
        key={`roster-renderer-${profile.antialias ? 'aa' : 'raw'}`}
        frameloop="demand"
        dpr={renderDpr}
        camera={{ position: [0, 0, 8], fov: 34 }}
        gl={{ alpha: true, antialias: profile.antialias, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[4, 6, 4]} intensity={3.5} color="#fff0d6" />
        <pointLight position={[-3, 1.5, 2]} intensity={3} color="#ff3d73" />
        <PreviewCamera fit={fit} pan={pan} zoom={zoom} />
        <Suspense fallback={null}>
          <RotatableRosterModel fit={fit} onFit={setFit} preview={preview} rotation={rotation} />
        </Suspense>
      </Canvas>
    </div>
  )
}
