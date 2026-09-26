import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, Group, MeshBasicMaterial } from 'three'
import { simClock } from '../sim/clock'
import { useSessionStore } from '../store/sessionStore'
import type { CharacterDefinition } from '../types/character'

/**
 * Co-op readability without HUD clutter: a coloured ring under each hero's feet
 * and a small chevron over the head. Both flash while the hero is invulnerable.
 */
export function HeroMarker({ definition }: { definition: CharacterDefinition }) {
  const chevron = useRef<Group>(null)
  const ringMaterial = useMemo(() => new MeshBasicMaterial({ color: new Color(definition.accent), transparent: true, opacity: 0.55, depthWrite: false, blending: AdditiveBlending, toneMapped: false }), [definition.accent])
  const chevronMaterial = useMemo(() => new MeshBasicMaterial({ color: new Color(definition.accent), transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false }), [definition.accent])

  useFrame(({ clock }) => {
    const session = useSessionStore.getState()
    const player = session.players[definition.id]
    const now = simClock.now()
    const visible = !player.dead && ['countdown', 'playing', 'boss-intro', 'final-intro', 'paused'].includes(session.phase)
    const blinking = player.invulnerableUntil > now && Math.sin(clock.elapsedTime * 28) > 0
    ringMaterial.opacity = visible ? (blinking ? 0.18 : 0.5 + Math.sin(clock.elapsedTime * 3) * 0.08) : 0
    chevronMaterial.opacity = visible ? 0.9 : 0
    if (chevron.current) {
      chevron.current.position.y = 3.25 + Math.sin(clock.elapsedTime * 2.4 + (definition.id === 'ali' ? 0 : 1.7)) * 0.07
      chevron.current.rotation.y = clock.elapsedTime * 1.6
    }
  })

  return (
    <group name={`${definition.id}-marker`}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} material={ringMaterial} renderOrder={2}>
        <ringGeometry args={[0.62, 0.74, 40]} />
      </mesh>
      <group ref={chevron} position={[0, 3.25, 0]}>
        <mesh rotation={[Math.PI, 0, 0]} material={chevronMaterial}>
          <coneGeometry args={[0.13, 0.24, 4]} />
        </mesh>
      </group>
    </group>
  )
}
