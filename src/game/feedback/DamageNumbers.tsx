import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { CHARACTERS } from '../../config/gameConfig'
import { gameEvents } from '../../sim/events'
import { useGameStore } from '../../store/gameStore'
import { useSettingsStore } from '../../store/settingsStore'

const POOL = 28
const LIFETIME = 0.85

interface FloatingText {
  element: HTMLSpanElement
  x: number
  y: number
  bornAt: number
  alive: boolean
}

/**
 * Pooled DOM numbers projected from world space: damage, kills and "KUSURSUZ"
 * dodges. Zero React renders per hit; one small transform write per frame.
 */
export function DamageNumbers() {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const projected = useMemo(() => new Vector3(), [])
  const pool = useRef<FloatingText[]>([])
  const cursor = useRef(0)

  useEffect(() => {
    const host = document.createElement('div')
    host.className = 'damage-numbers'
    host.setAttribute('aria-hidden', 'true')
    document.querySelector('.game-shell')?.appendChild(host)
    pool.current = Array.from({ length: POOL }, () => {
      const element = document.createElement('span')
      host.appendChild(element)
      return { element, x: 0, y: 0, bornAt: -10, alive: false }
    })
    const spawn = (text: string, x: number, y: number, className: string, color?: string) => {
      if (!useSettingsStore.getState().damageNumbers) return
      const item = pool.current[cursor.current % POOL]!
      cursor.current += 1
      item.element.textContent = text
      item.element.className = className
      item.element.style.color = color ?? ''
      item.x = x + (Math.random() - 0.5) * 0.5
      item.y = y
      item.bornAt = performance.now() / 1_000
      item.alive = true
    }
    const off = gameEvents.on((event) => {
      if (event.type === 'enemy-hit' && event.amount >= 1) {
        const text = String(Math.round(event.amount))
        spawn(text, event.x, event.y + 0.9, event.killed ? 'is-kill' : event.source === 'hazard' ? 'is-hazard' : '', event.killed ? undefined : CHARACTERS[event.attacker].accent)
      }
      if (event.type === 'player-dash' && event.perfect) {
        const [x, y] = useGameStore.getState().positions[event.id]
        spawn('KUSURSUZ', x, y + 2.6, 'is-perfect')
      }
    })
    return () => {
      off()
      host.remove()
    }
  }, [])

  useFrame(() => {
    const now = performance.now() / 1_000
    for (const item of pool.current) {
      if (!item.alive) continue
      const age = now - item.bornAt
      if (age >= LIFETIME) {
        item.alive = false
        item.element.style.opacity = '0'
        continue
      }
      projected.set(item.x, item.y + age * 1.1, 0).project(camera)
      const left = (projected.x * 0.5 + 0.5) * size.width
      const top = (-projected.y * 0.5 + 0.5) * size.height
      const pop = age < 0.08 ? 1 + (0.08 - age) * 6 : 1
      item.element.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0) translate(-50%, -50%) scale(${pop.toFixed(3)})`
      item.element.style.opacity = String(Math.min(1, (LIFETIME - age) * 4))
    }
  })

  return null
}
