import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ACESFilmicToneMapping, PCFShadowMap, SRGBColorSpace } from 'three'
import { GameWorld } from './GameWorld'
import { useSessionStore } from '../store/sessionStore'

const SHADOW_FPS = 24

function ShadowRenderBudget() {
  const gl = useThree((state) => state.gl)
  const elapsed = useRef(0)

  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    return () => { gl.shadowMap.autoUpdate = true }
  }, [gl])

  useFrame((_, delta) => {
    elapsed.current += Math.min(delta, 0.1)
    if (elapsed.current < 1 / SHADOW_FPS) return
    elapsed.current %= 1 / SHADOW_FPS
    gl.shadowMap.needsUpdate = true
  })
  return null
}

export function GameScene() {
  const phase = useSessionStore((state) => state.phase)
  const active = phase === 'countdown' || phase === 'boss-intro' || phase === 'final-intro' || phase === 'playing' || phase === 'ending'
  return (
    <Canvas
      className="game-canvas"
      shadows
      dpr={[0.8, 1]}
      frameloop={active ? 'always' : 'demand'}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.shadowMap.type = PCFShadowMap
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1.04
        gl.outputColorSpace = SRGBColorSpace
        gl.setClearColor('#000000', 0)
      }}
    >
      <Suspense fallback={null}>
        <ShadowRenderBudget />
        <GameWorld />
      </Suspense>
    </Canvas>
  )
}
