import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'

/** The far edge of the 3D floor (Ground.tsx: centre z -1, depth 42). */
const FLOOR_FAR_Z = -22

/**
 * Publishes where the 3D floor meets the sky on screen, so the DOM paintings
 * behind the canvas keep their ground line glued to it through every camera
 * move: zooms, boss framing and the portal ending alike.
 */
export function BackdropHorizon() {
  const point = useMemo(() => new Vector3(), [])
  const last = useRef('')
  const target = useRef<HTMLElement | null>(null)
  useFrame(({ camera }) => {
    target.current ??= document.querySelector<HTMLElement>('.scene-backdrop')
    if (!target.current) return
    point.set(camera.position.x, 0, FLOOR_FAR_Z).project(camera)
    const value = `${Math.max(-50, Math.min(150, (1 - point.y) * 50)).toFixed(2)}%`
    if (value === last.current) return
    last.current = value
    target.current.style.setProperty('--horizon-y', value)
  })
  return null
}
