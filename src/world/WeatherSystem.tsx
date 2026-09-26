import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  LineBasicMaterial,
  LineSegments,
  NormalBlending,
  Points,
  PointsMaterial,
  type Blending,
} from 'three'
import { BIOMES, getBiomeBlend, type BiomeDefinition } from '../config/biomes'
import { simClock } from '../sim/clock'
import { useMechanicsStore } from '../sim/mechanics'
import { useGameStore } from '../store/gameStore'
import { runtimeCrowdDetail, runtimeParticleRatio, usePerformanceStore } from '../store/performanceStore'
import { useSessionStore } from '../store/sessionStore'

type Weather = BiomeDefinition['weather']

interface WeatherStyle {
  count: number
  color: string
  size: number
  opacity: number
  velocity: [number, number]
  sway: number
  blending: Blending
  streak?: number
}

/** Weather follows the camera: one small volume of particles, restyled per biome. */
const STYLES: Record<Weather, WeatherStyle> = {
  embers: { count: 60, color: '#ff6aa0', size: 0.09, opacity: 0.85, velocity: [0.25, 0.7], sway: 0.5, blending: AdditiveBlending },
  rain: { count: 150, color: '#b9dcef', size: 0, opacity: 0.55, velocity: [-2.2, -15], sway: 0, blending: NormalBlending, streak: 0.55 },
  sand: { count: 120, color: '#f3cf8e', size: 0, opacity: 0.5, velocity: [-7.5, -0.4], sway: 0.4, blending: NormalBlending, streak: 0.04 },
  sparks: { count: 70, color: '#ffb347', size: 0.07, opacity: 0.95, velocity: [0.25, -2.8], sway: 0.35, blending: AdditiveBlending },
  storm: { count: 190, color: '#aebaff', size: 0, opacity: 0.5, velocity: [-4.2, -19], sway: 0, blending: NormalBlending, streak: 0.7 },
  fireflies: { count: 34, color: '#f2ff86', size: 0.11, opacity: 0.95, velocity: [0.1, 0.12], sway: 0.9, blending: AdditiveBlending },
  ash: { count: 80, color: '#9aa88a', size: 0.06, opacity: 0.7, velocity: [0.35, -0.55], sway: 0.6, blending: NormalBlending },
  mist: { count: 16, color: '#c9ffe6', size: 2.8, opacity: 0.075, velocity: [0.3, 0.02], sway: 0.3, blending: NormalBlending },
  snow: { count: 120, color: '#f2fbff', size: 0.085, opacity: 0.9, velocity: [-0.3, -0.9], sway: 0.7, blending: NormalBlending },
  firestorm: { count: 100, color: '#ff8a2a', size: 0.1, opacity: 0.9, velocity: [0.6, 1.4], sway: 0.8, blending: AdditiveBlending },
}

const BOX = { x: 15, yMin: -0.2, yMax: 9.2, zMin: -4.5, zMax: 7.5 }

function softDot() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const context = canvas.getContext('2d')!
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.7)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 64, 64)
  return new CanvasTexture(canvas)
}

interface Layer {
  weather: Weather
  object: Points | LineSegments
  positions: Float32Array
  seeds: Float32Array
  count: number
}

function createLayer(weather: Weather, texture: CanvasTexture, ratio: number): Layer {
  const style = STYLES[weather]
  const count = Math.max(8, Math.round(style.count * ratio))
  const vertices = style.streak ? count * 2 : count
  const positions = new Float32Array(vertices * 3)
  const seeds = new Float32Array(count * 3)
  for (let index = 0; index < count; index += 1) {
    seeds[index * 3] = (Math.random() * 2 - 1) * BOX.x
    seeds[index * 3 + 1] = BOX.yMin + Math.random() * (BOX.yMax - BOX.yMin)
    seeds[index * 3 + 2] = BOX.zMin + Math.random() * (BOX.zMax - BOX.zMin)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  const object = style.streak
    ? new LineSegments(geometry, new LineBasicMaterial({ color: style.color, transparent: true, opacity: 0, depthWrite: false }))
    : new Points(geometry, new PointsMaterial({ color: style.color, size: style.size, map: texture, transparent: true, opacity: 0, depthWrite: false, blending: style.blending, sizeAttenuation: true }))
  object.frustumCulled = false
  return { weather, object, positions, seeds, count }
}

export function WeatherSystem() {
  const tier = usePerformanceStore((state) => state.tier)
  const qualityFactor = usePerformanceStore((state) => state.qualityFactor)
  const crowdWeather = useSessionStore((state) => runtimeCrowdDetail(state.enemies.length).weather)
  const ratio = runtimeParticleRatio(tier, qualityFactor) * crowdWeather
  const texture = useMemo(() => softDot(), [])
  const layers = useMemo(() => [...new Set(BIOMES.map((biome) => biome.weather))].map((weather) => createLayer(weather, texture, ratio)), [ratio, texture])
  const time = useRef(0)

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1) * simClock.scale()
    time.current += delta
    const cameraX = useGameStore.getState().cameraX
    const blend = getBiomeBlend(cameraX)
    const mechanics = useMechanicsStore.getState()
    const gust = mechanics.gustUntil > simClock.now() && simClock.now() >= mechanics.gustStartedAt ? 1 : 0
    for (const layer of layers) {
      const weight = (blend.from.weather === layer.weather ? 1 - blend.mix : 0) + (blend.to.weather === layer.weather ? blend.mix : 0)
      const style = STYLES[layer.weather]
      const material = layer.object.material as PointsMaterial | LineBasicMaterial
      material.opacity = style.opacity * weight * (layer.weather === 'snow' ? 1 + gust * 0.4 : 1)
      layer.object.visible = weight > 0.01
      if (!layer.object.visible) continue
      const windX = style.velocity[0] - (layer.weather === 'snow' ? gust * 9 : 0)
      for (let index = 0; index < layer.count; index += 1) {
        const base = index * 3
        let x = layer.seeds[base]! + windX * delta + Math.sin(time.current * 0.9 + index) * style.sway * delta
        let y = layer.seeds[base + 1]! + style.velocity[1] * delta
        if (y > BOX.yMax) y = BOX.yMin
        if (y < BOX.yMin) y = BOX.yMax
        if (x > BOX.x) x -= BOX.x * 2
        if (x < -BOX.x) x += BOX.x * 2
        layer.seeds[base] = x
        layer.seeds[base + 1] = y
        const z = layer.seeds[base + 2]!
        if (style.streak) {
          const target = index * 6
          layer.positions[target] = cameraX + x
          layer.positions[target + 1] = y
          layer.positions[target + 2] = z
          layer.positions[target + 3] = cameraX + x - windX * 0.035
          layer.positions[target + 4] = y + style.streak
          layer.positions[target + 5] = z
        } else {
          layer.positions[base] = cameraX + x
          layer.positions[base + 1] = y
          layer.positions[base + 2] = z
        }
      }
      layer.object.geometry.getAttribute('position').needsUpdate = true
    }
  })

  return <group name="weather">{layers.map((layer) => <primitive key={layer.weather} object={layer.object} />)}</group>
}
