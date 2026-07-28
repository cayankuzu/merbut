import { beforeEach, describe, expect, it } from 'vitest'
import {
  classifyPerformanceSignals,
  graphicsPreferenceStorage,
  PERFORMANCE_PROFILES,
  usePerformanceStore,
} from './performanceStore'

describe('graphics performance preferences', () => {
  beforeEach(() => {
    graphicsPreferenceStorage.clear()
    usePerformanceStore.setState({
      preference: 'auto',
      tier: 'balanced',
      hardwareTier: 'balanced',
      fps: 60,
      p95FrameMs: 16.7,
      longFrames: 0,
      qualityFactor: 1,
      renderDpr: PERFORMANCE_PROFILES.balanced.dpr,
    })
  })

  it('keeps a manual quality choice locked against adaptive changes', () => {
    usePerformanceStore.setState({ hardwareTier: 'minimal' })
    usePerformanceStore.getState().setTier('high')
    usePerformanceStore.getState().setAdaptiveTier('performance')

    expect(usePerformanceStore.getState()).toMatchObject({
      preference: 'high',
      tier: 'high',
      qualityFactor: 1,
      renderDpr: PERFORMANCE_PROFILES.high.dpr,
    })
  })

  it('applies the full manual profile even when automatic detection found weak hardware', () => {
    usePerformanceStore.setState({
      preference: 'auto',
      tier: 'minimal',
      hardwareTier: 'minimal',
      qualityFactor: 1,
      renderDpr: PERFORMANCE_PROFILES.minimal.dpr,
    })

    usePerformanceStore.getState().setPreference('high')

    expect(usePerformanceStore.getState()).toMatchObject({
      preference: 'high',
      tier: 'high',
      qualityFactor: 1,
      renderDpr: PERFORMANCE_PROFILES.high.dpr,
    })
  })

  it('allows the governor to change an automatic profile', () => {
    usePerformanceStore.getState().setPreference('auto')
    usePerformanceStore.getState().setAdaptiveTier('performance')

    expect(usePerformanceStore.getState()).toMatchObject({ preference: 'auto', tier: 'performance' })
  })

  it('makes every quality dimension increase from minimal to ultra', () => {
    expect(PERFORMANCE_PROFILES.high.dpr).toBeGreaterThan(PERFORMANCE_PROFILES.balanced.dpr)
    expect(PERFORMANCE_PROFILES.balanced.dpr).toBeGreaterThan(PERFORMANCE_PROFILES.performance.dpr)
    expect(PERFORMANCE_PROFILES.performance.dpr).toBeGreaterThan(PERFORMANCE_PROFILES.minimal.dpr)
    expect(PERFORMANCE_PROFILES.high.shadowMapSize).toBe(2048)
    expect(PERFORMANCE_PROFILES.high.postprocessMultisampling).toBe(4)
    expect(PERFORMANCE_PROFILES.high.textureAnisotropy).toBe(8)
  })

  it('persists a manual choice for the next browser session', () => {
    usePerformanceStore.getState().setTier('high')
    const persisted = JSON.parse(graphicsPreferenceStorage.readRaw() ?? 'null')

    expect(persisted).toMatchObject({
      state: { preference: 'high' },
    })
  })

  it('does not write transient frame metrics to storage', () => {
    usePerformanceStore.getState().setTier('high')
    const before = graphicsPreferenceStorage.readRaw()
    usePerformanceStore.getState().reportWindow(42, 31)

    expect(graphicsPreferenceStorage.readRaw()).toBe(before)
  })

  it('starts conservative on an integrated Intel GPU despite a fast CPU', () => {
    expect(classifyPerformanceSignals({
      cores: 16,
      devicePixelRatio: 1,
      gpuRenderer: 'ANGLE (Intel, Intel(R) UHD Graphics Direct3D11)',
      memory: 16,
      viewportHeight: 1080,
      viewportWidth: 1920,
    })).toBe('minimal')
  })

  it('allows ultra on a strong discrete GPU with adequate memory', () => {
    expect(classifyPerformanceSignals({
      cores: 12,
      devicePixelRatio: 1,
      gpuRenderer: 'ANGLE (NVIDIA GeForce RTX 4070 Direct3D11)',
      memory: 16,
      viewportHeight: 1440,
      viewportWidth: 2560,
    })).toBe('high')
  })
})
