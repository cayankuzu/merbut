import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import type { CharacterId } from '../types/character'
import { RotatingCharacterPreview } from './RotatingCharacterPreview'
import { useSessionStore } from '../store/sessionStore'
import { useGameStore } from '../store/gameStore'
import { MenuAttackEffect, type MenuAttackEffectKind } from './MenuAttackEffect'

interface CharacterPreview3DProps {
  id: CharacterId
  compact?: boolean
}

function LiveCharacterPreview({ id }: { id: CharacterId }) {
  const animationState = useGameStore((state) => state.animationStates[id])
  const abilityShots = useSessionStore((state) => state.players[id].abilityShots)
  const abilityActiveUntil = useSessionStore((state) => state.players[id].abilityActiveUntil)
  const [trigger, setTrigger] = useState(0)
  const previousSignal = useRef('')
  const signal = `${animationState}:${id === 'ali' ? abilityShots : abilityActiveUntil}`

  useEffect(() => {
    if (signal === previousSignal.current) return
    previousSignal.current = signal
    if (animationState === 'attack' || animationState === 'fireball' || animationState === 'shield') {
      setTrigger((value) => value + 1)
    }
  }, [animationState, signal])

  const effect: MenuAttackEffectKind = id === 'ali'
    ? animationState === 'fireball' ? 'ali-fireball' : 'ali-slash'
    : animationState === 'shield' ? 'jack-shield' : 'jack-slash'

  return (
    <group>
      <RotatingCharacterPreview id={id} animationState={animationState} initialRotation={0} rotate={false} />
      <MenuAttackEffect accent={id === 'ali' ? '#f7c65f' : '#ff4c87'} direction={-1} kind={effect} originY={1.3} trigger={trigger} variant={0} />
    </group>
  )
}

export function CharacterPreview3D({ id, compact = false }: CharacterPreview3DProps) {
  const paused = useSessionStore((state) => state.phase === 'paused')
  return (
    <div className={`character-preview${compact ? ' character-preview--compact' : ''}`} aria-label={`${id === 'ali' ? 'Hz. Ali' : 'Samuray Jack'} dönen 3B figürü`}>
      <Canvas
        frameloop={paused ? 'never' : 'always'}
        dpr={[1, 1.35]}
        camera={{ position: [0, compact ? 1.18 : 1.25, compact ? 5 : 5.25], fov: compact ? 32 : 34 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={1.4} />
        <directionalLight position={[3, 5, 4]} intensity={3.2} color={id === 'ali' ? '#ffd78a' : '#ffe8f0'} />
        <pointLight position={[-2, 1, 2]} intensity={2.1} color={id === 'ali' ? '#ff8b32' : '#ff3d86'} />
        <Suspense fallback={null}>{compact ? <LiveCharacterPreview id={id} /> : <RotatingCharacterPreview id={id} />}</Suspense>
      </Canvas>
    </div>
  )
}
