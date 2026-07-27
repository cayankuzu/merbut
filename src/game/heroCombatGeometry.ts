import { Shape, ShapeGeometry } from 'three'

export const ALI_FLAME_ARCS = [
  { color: '#fff4ad', position: [0.3, 0.42, 0.09] as [number, number, number], rotation: -0.9, scale: 0.94 },
  { color: '#ff9a21', position: [0.44, 0.72, 0.12] as [number, number, number], rotation: -0.58, scale: 1.08 },
  { color: '#ff3510', position: [0.58, 1.02, 0.15] as [number, number, number], rotation: -0.25, scale: 0.9 },
] as const

export const JACK_SLASHES = [0, 1, 2] as const

export function createAliFlameArcGeometry() {
  const shape = new Shape()
  shape.moveTo(-1.15, -0.04)
  shape.quadraticCurveTo(0.1, 0.68, 1.32, 0.08)
  shape.quadraticCurveTo(0.08, 0.36, -1.15, -0.04)
  return new ShapeGeometry(shape, 24)
}

export function createJackSlashGeometry() {
  const shape = new Shape()
  shape.moveTo(-1.35, 0)
  shape.quadraticCurveTo(0, 0.52, 1.35, 0)
  shape.quadraticCurveTo(0, 0.31, -1.35, 0)
  return new ShapeGeometry(shape, 18)
}
