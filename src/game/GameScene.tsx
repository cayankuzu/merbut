import { lazy, Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  ACESFilmicToneMapping,
  Mesh,
  PCFShadowMap,
  PCFSoftShadowMap,
  SRGBColorSpace,
  Texture,
} from 'three'
import { GameWorld } from './GameWorld'
import { useSessionStore } from '../store/sessionStore'
import { PERFORMANCE_PROFILES, type PerformanceTier, usePerformanceStore } from '../store/performanceStore'

const LOWER_TIER: Record<PerformanceTier, PerformanceTier> = {
  high: 'balanced', balanced: 'performance', performance: 'minimal', minimal: 'minimal',
}
const AdaptiveVisualGrade = lazy(() => import('./AdaptiveVisualGrade').then((module) => ({ default: module.AdaptiveVisualGrade })))

function ShadowRenderBudget() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const elapsed = useRef(0)
  const tier = usePerformanceStore((state) => state.tier)
  const qualityFactor = usePerformanceStore((state) => state.qualityFactor)
  const profile = PERFORMANCE_PROFILES[tier]
  const shadowFps = profile.shadows && qualityFactor >= 0.6
    ? Math.max(4, Math.round(profile.shadowFps * qualityFactor))
    : 0

  useEffect(() => {
    gl.shadowMap.type = profile.softShadows ? PCFSoftShadowMap : PCFShadowMap
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.enabled = shadowFps > 0
    gl.shadowMap.needsUpdate = shadowFps > 0
    scene.traverse((node) => {
      if (!(node instanceof Mesh)) return
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      materials.forEach((material) => { material.needsUpdate = true })
    })
    return () => { gl.shadowMap.autoUpdate = true }
  }, [gl, profile.softShadows, scene, shadowFps])

  useFrame((_, delta) => {
    if (shadowFps <= 0) return
    elapsed.current += Math.min(delta, 0.1)
    if (elapsed.current < 1 / shadowFps) return
    elapsed.current %= 1 / shadowFps
    gl.shadowMap.needsUpdate = true
  })
  return null
}

function TextureQuality() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const tier = usePerformanceStore((state) => state.tier)
  const scansRemaining = useRef(0)
  const nextScanAt = useRef(0)

  useEffect(() => {
    scansRemaining.current = 2
    nextScanAt.current = 0
  }, [tier])

  useFrame(({ clock }) => {
    if (scansRemaining.current <= 0 || clock.elapsedTime < nextScanAt.current) return
    scansRemaining.current -= 1
    nextScanAt.current = clock.elapsedTime + 0.75
    const target = Math.min(
      PERFORMANCE_PROFILES[tier].textureAnisotropy,
      gl.capabilities.getMaxAnisotropy(),
    )
    scene.traverse((node) => {
      if (!(node instanceof Mesh)) return
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      materials.forEach((material) => {
        Object.values(material).forEach((value) => {
          if (!(value instanceof Texture) || value.anisotropy === target) return
          value.anisotropy = target
          value.needsUpdate = true
        })
      })
    })
  })

  return null
}

function RuntimePerformanceGovernor({ active }: { active: boolean }) {
  const setDpr = useThree((state) => state.setDpr)
  const renderDpr = usePerformanceStore((state) => state.renderDpr)
  const samples = useRef<number[]>([])
  const elapsed = useRef(0)
  const activeElapsed = useRef(0)
  const slowWindows = useRef(0)
  const fastWindows = useRef(0)

  useEffect(() => {
    setDpr(renderDpr)
  }, [renderDpr, setDpr])

  useEffect(() => {
    if (!('PerformanceObserver' in window)) return
    const supported = PerformanceObserver.supportedEntryTypes
    if (!supported.includes('long-animation-frame')) return
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration >= 50) usePerformanceStore.getState().noteLongFrame()
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
    if (activeElapsed.current < 1.25) return
    samples.current.push(delta * 1_000)
    elapsed.current += delta
    if (elapsed.current < 1 || samples.current.length < 12) return

    const ordered = [...samples.current].sort((a, b) => a - b)
    const average = samples.current.reduce((sum, value) => sum + value, 0) / samples.current.length
    const fps = Math.min(240, 1_000 / Math.max(1, average))
    const p95 = ordered[Math.min(ordered.length - 1, Math.floor(ordered.length * 0.95))] ?? average
    const store = usePerformanceStore.getState()
    store.reportWindow(fps, p95)

    const profile = PERFORMANCE_PROFILES[store.tier]
    const critical = fps < 32 || p95 > 75
    const underBudget = fps < 52 || p95 > 32
    const comfortablyFast = fps > 58 && p95 < 22
    slowWindows.current = underBudget ? slowWindows.current + 1 : 0
    fastWindows.current = comfortablyFast ? fastWindows.current + 1 : 0
    const dprStep = critical ? 0.18 : 0.08
    if (critical || slowWindows.current >= 2) {
      const nextDpr = Math.max(profile.minimumDpr, Math.round((store.renderDpr - dprStep) * 100) / 100)
      store.setRenderDpr(nextDpr)
      const atDprFloor = nextDpr <= profile.minimumDpr + 0.01
      if (atDprFloor) {
        const qualityStep = critical ? 0.16 : 0.08
        store.setQualityFactor(Math.max(0.2, Math.round((store.qualityFactor - qualityStep) * 100) / 100))
      }
      slowWindows.current = 0
      fastWindows.current = 0
      const phase = useSessionStore.getState().phase
      if (store.preference === 'auto' && phase === 'countdown' && critical && atDprFloor && store.qualityFactor <= 0.2) {
        store.setAdaptiveTier(LOWER_TIER[store.tier])
      }
    } else if (fastWindows.current >= 3) {
      if (store.qualityFactor < 1) {
        store.setQualityFactor(Math.min(1, Math.round((store.qualityFactor + 0.06) * 100) / 100))
      } else if (store.renderDpr < profile.dpr) {
        store.setRenderDpr(Math.min(profile.dpr, Math.round((store.renderDpr + 0.06) * 100) / 100))
      }
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
  const qualityFactor = usePerformanceStore((state) => state.qualityFactor)
  const renderDpr = usePerformanceStore((state) => state.renderDpr)
  const profile = PERFORMANCE_PROFILES[tier]
  return (
    <Canvas
      className="game-canvas"
      data-graphics-tier={tier}
      data-quality-factor={qualityFactor.toFixed(2)}
      data-render-dpr={renderDpr.toFixed(2)}
      shadows={profile.shadows}
      dpr={renderDpr}
      frameloop={active ? 'always' : 'demand'}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
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
        <TextureQuality />
        <GameWorld />
        {(tier === 'balanced' || tier === 'high') && qualityFactor >= 0.6 ? (
          <Suspense fallback={null}><AdaptiveVisualGrade qualityFactor={qualityFactor} tier={tier} /></Suspense>
        ) : null}
      </Suspense>
    </Canvas>
  )
}
