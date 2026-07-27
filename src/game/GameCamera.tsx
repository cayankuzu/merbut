import { useEffect, useRef } from 'react'
import { PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, PerspectiveCamera as ThreePerspectiveCamera, Vector3 } from 'three'
import { GAME_CONFIG } from '../config/gameConfig'
import { useDebugStore } from '../store/debugStore'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'
import { clampCameraX } from '../utils/clampCamera'

export function GameCamera() {
  const cameraRef = useRef<ThreePerspectiveCamera>(null)
  const lookTarget = useRef(new Vector3())
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

    const session = useSessionStore.getState()
    const portalCinematic = session.phase === 'ending' && ['portal', 'falling', 'continued'].includes(session.bossPhase)
    const smoothingDelta = Math.min(delta, 0.05)
    if (portalCinematic) {
      const portalX = session.endingPortalX
      camera.up.set(0, 0, -1)
      camera.position.x = MathUtils.damp(camera.position.x, portalX, 4.8, smoothingDelta)
      camera.position.y = MathUtils.damp(camera.position.y, 15.8, 4.2, smoothingDelta)
      camera.position.z = MathUtils.damp(camera.position.z, 0.01, 5.4, smoothingDelta)
      camera.fov = MathUtils.damp(camera.fov, 46, 4.5, smoothingDelta)
      camera.updateProjectionMatrix()
      lookTarget.current.set(portalX, 0, 0)
      camera.lookAt(lookTarget.current)
      useGameStore.getState().setCameraX(portalX)
      return
    }

    const { positions } = useGameStore.getState()
    const midpoint = (positions.ali[0] + positions.jack[0]) / 2
    const separation = Math.abs(positions.ali[0] - positions.jack[0])
    const highestPlayer = Math.max(positions.ali[1], positions.jack[1])
    const targetX = clampCameraX(midpoint, GAME_CONFIG.camera.xBounds)
    const pullback = MathUtils.clamp((separation - 2.6) * 0.48, 0, GAME_CONFIG.camera.maxDistance - cameraDistance)
    const targetY = cameraHeight + highestPlayer * 0.13
    camera.up.set(0, 1, 0)
    camera.fov = MathUtils.damp(camera.fov, 42, 4.5, smoothingDelta)
    camera.updateProjectionMatrix()

    camera.position.x = MathUtils.damp(camera.position.x, targetX, 4.8, smoothingDelta)
    camera.position.y = MathUtils.damp(camera.position.y, targetY, 5.2, smoothingDelta)
    camera.position.z = MathUtils.damp(camera.position.z, cameraDistance + pullback, 4.2, smoothingDelta)
    lookTarget.current.set(camera.position.x, 3.15 + highestPlayer * 0.11, 0)
    camera.lookAt(lookTarget.current)
    useGameStore.getState().setCameraX(camera.position.x)
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
