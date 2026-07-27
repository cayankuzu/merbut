import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, PCFShadowMap, SRGBColorSpace } from 'three'
import { GameWorld } from './GameWorld'
import { useSessionStore } from '../store/sessionStore'

export function GameScene() {
  const paused = useSessionStore((state) => state.phase === 'paused')
  return (
    <Canvas
      className="game-canvas"
      shadows
      dpr={[1, 1.5]}
      frameloop={paused ? 'demand' : 'always'}
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
