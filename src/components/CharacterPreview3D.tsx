import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import type { CharacterId } from '../types/character'
import { RotatingCharacterPreview } from './RotatingCharacterPreview'
import { useSessionStore } from '../store/sessionStore'
import { PERFORMANCE_PROFILES, usePerformanceStore } from '../store/performanceStore'

interface CharacterPreview3DProps {
  id: CharacterId
  compact?: boolean
}

const HUD_PORTRAITS: Record<CharacterId, string> = {
  ali: '/assets/ui/ali-hud.webp',
  jack: '/assets/ui/jack-hud.webp',
}

function PreviewFrameScheduler({ active, fps }: { active: boolean; fps: number }) {
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    if (!active) return
    invalidate()
    const timer = window.setInterval(invalidate, 1_000 / fps)
    return () => window.clearInterval(timer)
  }, [active, fps, invalidate])
  return null
}

function CharacterPreviewCanvas({ id }: { id: CharacterId }) {
  const paused = useSessionStore((state) => state.phase === 'paused')
  const tier = usePerformanceStore((state) => state.tier)
  const qualityFactor = usePerformanceStore((state) => state.qualityFactor)
  const renderDpr = usePerformanceStore((state) => state.renderDpr)
  const profile = PERFORMANCE_PROFILES[tier]
  const previewFps = qualityFactor < 0.5 ? 30 : qualityFactor < 0.75 ? 45 : profile.menuFps
  const briefingDistance = id === 'ali' ? 6.5 : 5.55
  const briefingPanX = id === 'ali' ? -0.14 : 0
  return (
    <div className="character-preview" aria-label={`${id === 'ali' ? 'Hz. Ali' : 'Samuray Jack'} dönen 3B figürü`}>
      <Canvas
        key={`preview-renderer-${profile.antialias ? 'aa' : 'raw'}`}
        frameloop={paused ? 'never' : 'demand'}
        dpr={renderDpr}
        camera={{ position: [briefingPanX, 1.25, briefingDistance], fov: 34 }}
        gl={{ alpha: true, antialias: profile.antialias, powerPreference: 'high-performance' }}
      >
        <PreviewFrameScheduler active={!paused} fps={previewFps} />
        <ambientLight intensity={1.4} />
        <directionalLight position={[3, 5, 4]} intensity={3.2} color={id === 'ali' ? '#ffd78a' : '#ffe8f0'} />
        <pointLight position={[-2, 1, 2]} intensity={2.1} color={id === 'ali' ? '#ff8b32' : '#ff3d86'} />
        <Suspense fallback={null}>
          <RotatingCharacterPreview id={id} initialRotation={Math.PI} />
        </Suspense>
      </Canvas>
    </div>
  )
}

export function CharacterPreview3D({ id, compact = false }: CharacterPreview3DProps) {
  if (!compact) return <CharacterPreviewCanvas id={id} />
  const label = id === 'ali' ? 'Hz. Ali' : 'Samuray Jack'
  return (
    <div className="character-preview character-preview--compact" aria-label={`${label} portresi`}>
      <img src={HUD_PORTRAITS[id]} alt="" decoding="async" draggable={false} />
    </div>
  )
}
