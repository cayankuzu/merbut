import { useEffect, useRef } from 'react'
import { PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, PerspectiveCamera as ThreePerspectiveCamera, Vector3 } from 'three'
import { GAME_CONFIG } from '../config/gameConfig'
import { useDebugStore } from '../store/debugStore'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'
import { clampCameraX } from '../utils/clampCamera'
import { currentTrauma } from './feedback/hitFeedback'

export function GameCamera() {
  const cameraRef = useRef<ThreePerspectiveCamera>(null)
  const lookTarget = useRef(new Vector3())
  const previousShake = useRef(new Vector3())
  const publishElapsed = useRef(0)
  const cameraHeight = useDebugStore((state) => state.cameraHeight)
  const cameraDistance = useDebugStore((state) => state.cameraDistance)
  const phase = useSessionStore((state) => state.phase)
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    if (phase !== 'paused' || !cameraRef.current) return
    const { positions } = useGameStore.getState()
    const camera = cameraRef.current
    const midpoint = (positions.ali[0] + positions.jack[0]) / 2
    const highestPlayer = Math.max(positions.ali[1], positions.jack[1])
    camera.position.set(clampCameraX(midpoint, GAME_CONFIG.camera.xBounds), cameraHeight + highestPlayer * 0.13, cameraDistance)
    camera.up.set(0, 1, 0)
    camera.lookAt(camera.position.x, 3.15 + highestPlayer * 0.11, 0)
    invalidate()
  }, [cameraDistance, cameraHeight, invalidate, phase])

  useFrame((_, delta) => {
    const camera = cameraRef.current
    if (!camera) return

    // Remove the previous frame's transient impact offset before camera
    // damping so repeated hits cannot accumulate into positional drift.
    camera.position.sub(previousShake.current)
    previousShake.current.set(0, 0, 0)

    const session = useSessionStore.getState()
    const portalCinematic = session.phase === 'ending' && ['portal', 'falling', 'continued'].includes(session.bossPhase)
    const smoothingDelta = Math.min(delta, 0.1)
    publishElapsed.current += smoothingDelta
    if (portalCinematic) {
      const portalX = session.endingPortalX
      camera.up.set(0, 0, -1)
      camera.position.x = MathUtils.damp(camera.position.x, portalX, 4.8, smoothingDelta)
      camera.position.y = MathUtils.damp(camera.position.y, 15.8, 4.2, smoothingDelta)
      camera.position.z = MathUtils.damp(camera.position.z, 0.01, 5.4, smoothingDelta)
      const nextFov = MathUtils.damp(camera.fov, 46, 4.5, smoothingDelta)
      if (Math.abs(nextFov - camera.fov) > 0.001) {
        camera.fov = nextFov
        camera.updateProjectionMatrix()
      }
      lookTarget.current.set(portalX, 0, 0)
      camera.lookAt(lookTarget.current)
      if (publishElapsed.current >= 1 / 30) {
        publishElapsed.current %= 1 / 30
        useGameStore.getState().setCameraX(portalX)
      }
      return
    }

    const { positions } = useGameStore.getState()
    const midpoint = (positions.ali[0] + positions.jack[0]) / 2
    const separation = Math.abs(positions.ali[0] - positions.jack[0])
    const highestPlayer = Math.max(positions.ali[1], positions.jack[1])
    // During a boss fight the camera leans toward the boss and pulls back so
    // the whole duel (and every telegraph) stays in frame.
    const boss = session.bossPhase === 'fight' ? session.enemies.find((enemy) => enemy.boss && enemy.animation !== 'dead') : undefined
    const framedX = boss ? midpoint + MathUtils.clamp(boss.x - midpoint, -7, 7) * 0.32 : midpoint
    const targetX = clampCameraX(framedX, GAME_CONFIG.camera.xBounds)
    const bossPullback = boss ? 2.4 : 0
    const pullback = MathUtils.clamp((separation - 2.6) * 0.48 + bossPullback, 0, GAME_CONFIG.camera.maxDistance + 2.4 - cameraDistance)
    const targetY = cameraHeight + highestPlayer * 0.13
    camera.up.set(0, 1, 0)
    const nextFov = MathUtils.damp(camera.fov, 42, 4.5, smoothingDelta)
    if (Math.abs(nextFov - camera.fov) > 0.001) {
      camera.fov = nextFov
      camera.updateProjectionMatrix()
    }

    camera.position.x = MathUtils.damp(camera.position.x, targetX, 4.8, smoothingDelta)
    camera.position.y = MathUtils.damp(camera.position.y, targetY, 5.2, smoothingDelta)
    camera.position.z = MathUtils.damp(camera.position.z, cameraDistance + pullback, 4.2, smoothingDelta)
    const baseCameraX = camera.position.x
    // Trauma-based shake: strong hits shake more, and it always settles quickly.
    const trauma = currentTrauma()
    const shakeAmplitude = trauma * trauma * 0.32
    if (shakeAmplitude > 0.001) {
      const t = performance.now() * 0.001
      previousShake.current.set(
        (Math.sin(t * 47.3) + Math.sin(t * 31.7 + 1.3) * 0.6) * shakeAmplitude,
        (Math.cos(t * 43.1) + Math.sin(t * 27.9 + 0.7) * 0.6) * shakeAmplitude * 0.6,
        0,
      )
      camera.position.add(previousShake.current)
    }
    lookTarget.current.set(camera.position.x, 3.15 + highestPlayer * 0.11, 0)
    camera.lookAt(lookTarget.current)
    if (publishElapsed.current >= 1 / 30) {
      publishElapsed.current %= 1 / 30
      useGameStore.getState().setCameraX(baseCameraX)
    }
  })

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={42}
      near={0.1}
      far={80}
      position={[0, cameraHeight, cameraDistance]}
    />
  )
}
