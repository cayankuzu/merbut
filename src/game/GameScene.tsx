import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, PCFShadowMap, SRGBColorSpace } from 'three'
import { GameWorld } from './GameWorld'
import { useSessionStore } from '../store/sessionStore'

export function GameScene() {
  const phase = useSessionStore((state) => state.phase)
  const active = phase === 'countdown' || phase === 'boss-intro' || phase === 'final-intro' || phase === 'playing' || phase === 'ending'
  return (
    <Canvas
      className="game-canvas"
      shadows
      dpr={[0.85, 1.25]}
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
        <GameWorld />
      </Suspense>
    </Canvas>
  )
}
