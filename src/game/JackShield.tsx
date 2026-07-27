import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'
import { JackShieldVisual } from './JackShieldVisual'

export function JackShield() {
  const root = useRef<Group>(null)
  useFrame((_, delta) => {
    if (!root.current) return
    const session = useSessionStore.getState()
    const active = session.phase === 'playing' && session.players.jack.abilityActiveUntil > performance.now() && !session.players.jack.dead
    root.current.visible = active
    const [x, y] = useGameStore.getState().positions.jack
    root.current.position.set(x, y + 1.4, 0)
    root.current.rotation.y += delta * 0.72
  })
  return (
    <group ref={root} visible={false} name="jack-shield" position={[0, 1.4, 0]}>
      <JackShieldVisual />
    </group>
  )
}
