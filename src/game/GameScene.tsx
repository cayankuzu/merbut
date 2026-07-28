import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ACESFilmicToneMapping, PCFShadowMap, SRGBColorSpace } from 'three'
import { GameWorld } from './GameWorld'
import { useSessionStore } from '../store/sessionStore'
import { PERFORMANCE_PROFILES, type PerformanceTier, usePerformanceStore } from '../store/performanceStore'

const LOWER_TIER: Record<PerformanceTier, PerformanceTier> = {
  high: 'balanced', balanced: 'performance', performance: 'performance',
}
const HIGHER_TIER: Record<PerformanceTier, PerformanceTier> = {
  high: 'high', balanced: 'high', performance: 'balanced',
}

function ShadowRenderBudget() {
  const gl = useThree((state) => state.gl)
  const elapsed = useRef(0)
  const tier = usePerformanceStore((state) => state.tier)
  const shadowFps = PERFORMANCE_PROFILES[tier].shadowFps

  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.enabled = shadowFps > 0
    gl.shadowMap.needsUpdate = shadowFps > 0
    return () => { gl.shadowMap.autoUpdate = true }
  }, [gl, shadowFps])

  useFrame((_, delta) => {
    if (shadowFps <= 0) return
    elapsed.current += Math.min(delta, 0.1)
    if (elapsed.current < 1 / shadowFps) return
    elapsed.current %= 1 / shadowFps
    gl.shadowMap.needsUpdate = true
  })
  return null
}

function RuntimePerformanceGovernor({ active }: { active: boolean }) {
  const setDpr = useThree((state) => state.setDpr)
  const tier = usePerformanceStore((state) => state.tier)
  const samples = useRef<number[]>([])
  const elapsed = useRef(0)
  const activeElapsed = useRef(0)
  const slowWindows = useRef(0)
  const fastWindows = useRef(0)

  useEffect(() => {
    const target = Math.min(window.devicePixelRatio || 1, PERFORMANCE_PROFILES[tier].dpr)
    setDpr(target)
  }, [setDpr, tier])

  useEffect(() => {
    if (!('PerformanceObserver' in window)) return
    const supported = PerformanceObserver.supportedEntryTypes
    if (!supported.includes('long-animation-frame')) return
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration >= 120) usePerformanceStore.getState().noteLongFrame()
      }
    })
    observer.observe({ type: 'long-animation-frame', buffered: true })
    return () => observer.disconnect()
  }, [])

  useFrame((_, rawDelta) => {
    if (!active || document.hidden) {
      samples.current.length = 0
      elapsed.current = 0
      activeElapsed.current = 0
      return
    }
    const delta = Math.min(rawDelta, 0.25)
    activeElapsed.current += delta
    if (activeElapsed.current < 7) return
    samples.current.push(delta * 1_000)
    elapsed.current += delta
    if (elapsed.current < 2.4 || samples.current.length < 20) return

    const ordered = [...samples.current].sort((a, b) => a - b)
    const average = samples.current.reduce((sum, value) => sum + value, 0) / samples.current.length
    const fps = Math.min(120, 1_000 / Math.max(1, average))
    const p95 = ordered[Math.min(ordered.length - 1, Math.floor(ordered.length * 0.95))] ?? average
    const store = usePerformanceStore.getState()
    store.reportWindow(fps, p95)

    const underBudget = fps < 43 || p95 > 52
    const comfortablyFast = fps > 57 && p95 < 24
    slowWindows.current = underBudget ? slowWindows.current + 1 : 0
    fastWindows.current = comfortablyFast ? fastWindows.current + 1 : 0
    if (slowWindows.current >= 2) {
      store.setTier(LOWER_TIER[store.tier])
      slowWindows.current = 0
      fastWindows.current = 0
    } else if (fastWindows.current >= 4) {
      store.setTier(HIGHER_TIER[store.tier])
      slowWindows.current = 0
      fastWindows.current = 0
    }
    samples.current.length = 0
    elapsed.current = 0
  })

  return null
}

export function GameScene() {
  const phase = useSessionStore((state) => state.phase)
  const active = phase === 'countdown' || phase === 'boss-intro' || phase === 'final-intro' || phase === 'playing' || phase === 'ending'
  const tier = usePerformanceStore((state) => state.tier)
  const profile = PERFORMANCE_PROFILES[tier]
  return (
    <Canvas
      className="game-canvas"
      shadows={profile.shadows}
      dpr={profile.dpr}
      frameloop={active ? 'always' : 'demand'}
      gl={{ antialias: tier !== 'performance', alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.shadowMap.type = PCFShadowMap
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1.04
        gl.outputColorSpace = SRGBColorSpace
        gl.setClearColor('#000000', 0)
      }}
    >
      <Suspense fallback={null}>
        <RuntimePerformanceGovernor active={active} />
        <ShadowRenderBudget />
        <GameWorld />
      </Suspense>
    </Canvas>
  )
}
