import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, CanvasTexture, Color, Group, MeshBasicMaterial } from 'three'
import { CHARACTERS } from '../config/gameConfig'
import { gameEvents } from '../sim/events'
import { useGameStore } from '../store/gameStore'
import type { CharacterId } from '../types/character'

const LIFETIME = 0.3
/** Height, length and lag of each wind streak left behind by a dash. */
const STREAKS = [[0.35, 1.9, 0.1], [0.7, 1.3, 0.35], [1.05, 2.3, 0.05], [1.4, 1.5, 0.25], [1.75, 1.9, 0.15], [2.05, 1.1, 0.4], [0.9, 0.9, 0.6]] as const

/** A long streak that is bright at the hero and fades to nothing behind. */
function streakTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 8
  const context = canvas.getContext('2d')!
  const gradient = context.createLinearGradient(0, 0, 128, 0)
  gradient.addColorStop(0, 'rgba(255,255,255,0)')
  gradient.addColorStop(0.75, 'rgba(255,255,255,0.8)')
  gradient.addColorStop(1, 'rgba(255,255,255,1)')
  context.fillStyle = gradient
  context.fillRect(0, 2, 128, 4)
  return new CanvasTexture(canvas)
}

/** Wind streaks behind a dash; a perfect dodge leaves brighter, white ones. */
export function DashTrail({ id }: { id: CharacterId }) {
  const group = useRef<Group>(null)
  const startedAt = useRef(-10)
  const perfect = useRef(false)
  const startX = useRef(0)
  const texture = useMemo(streakTexture, [])
  const material = useMemo(() => new MeshBasicMaterial({ map: texture, color: new Color(CHARACTERS[id].accent), transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, toneMapped: false }), [id, texture])

  useEffect(() => () => { texture.dispose(); material.dispose() }, [material, texture])
  useEffect(() => gameEvents.on((event) => {
    if (event.type !== 'player-dash' || event.id !== id) return
    startedAt.current = performance.now() / 1_000
    perfect.current = event.perfect
    startX.current = useGameStore.getState().positions[id][0]
  }), [id])

  useFrame(() => {
    const age = performance.now() / 1_000 - startedAt.current
    const alive = age < LIFETIME
    if (group.current) group.current.visible = alive
    if (!alive) return
    // Streaks trail behind the direction of travel, whichever way the hero faces.
    const travel = useGameStore.getState().positions[id][0] - startX.current
    if (group.current && Math.abs(travel) > 0.05) group.current.scale.x = travel >= 0 ? 1 : -1
    material.opacity = (1 - age / LIFETIME) * (perfect.current ? 1 : 0.7)
    material.color.set(perfect.current ? '#ffffff' : CHARACTERS[id].accent)
  })

  return (
    <group ref={group} visible={false}>
      {STREAKS.map(([height, length, lag], index) => (
        <mesh key={index} position={[-length / 2 - lag, height, index % 2 ? 0.3 : -0.2]} material={material} scale={[length, 0.05, 1]}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  )
}
