import { create } from 'zustand'

export type PerformanceTier = 'minimal' | 'performance' | 'balanced' | 'high'
export type GraphicsPreference = 'auto' | PerformanceTier

export interface PerformanceProfile {
  actorMountDistance: number
  animationFps: number
  antialias: boolean
  dpr: number
  dynamicLights: boolean
  impactBudget: number
  menuFps: number
  minimumDpr: number
  particleRatio: number
  postprocessMultisampling: 0 | 2 | 4
  postprocessResolutionScale: number
  shadowFps: number
  shadowMapSize: 256 | 512 | 1024 | 2048
  shadows: boolean
  softShadows: boolean
  textureAnisotropy: 1 | 2 | 4 | 8
}

export interface DevicePerformanceSignals {
  cores: number
  devicePixelRatio: number
  gpuRenderer: string
  memory: number
  viewportHeight: number
  viewportWidth: number
}

const deviceMemory = () => {
  if (typeof navigator === 'undefined') return 4
  return (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
}

export function isSafariWebkitEngine() {
  if (typeof navigator === 'undefined') return false
  return /Safari/i.test(navigator.userAgent) && !/(Chrome|Chromium|Edg)/i.test(navigator.userAgent)
}

function detectGpuRenderer() {
  if (typeof document === 'undefined' || typeof WebGLRenderingContext === 'undefined') return ''
  const mobileHint = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile
  if (mobileHint || /(Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile)/i.test(navigator.userAgent)) return ''
  const canvas = document.createElement('canvas')
  try {
    const gl = canvas.getContext('webgl2', { powerPreference: 'high-performance' })
      ?? canvas.getContext('webgl', { powerPreference: 'high-performance' })
    if (!gl) return ''
    const debug = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) ?? '') : ''
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return renderer
  } catch {
    return ''
  }
}

export function classifyPerformanceSignals(signals: DevicePerformanceSignals): PerformanceTier {
  const gpu = signals.gpuRenderer.toLowerCase()
  const pixelLoad = signals.viewportWidth * signals.viewportHeight * Math.min(2, signals.devicePixelRatio) ** 2
  const softwareGpu = /(swiftshader|llvmpipe|software|microsoft basic render)/.test(gpu)
  const legacyIntegratedGpu = /(intel.*(?:uhd|hd graphics)|radeon r[2-7]|geforce [6789][0-9]{2})/.test(gpu)
  const integratedGpu = /(intel|iris|vega|radeon graphics|apple m1)/.test(gpu)
  const strongGpu = /(rtx|radeon rx [5-9]|rx [5-9][0-9]{3}|arc a[5-9]|apple m[2-9]|gtx 1[06789])/.test(gpu)

  if (softwareGpu || signals.cores <= 1 || signals.memory <= 1) return 'minimal'
  if (legacyIntegratedGpu) return 'minimal'
  if (signals.cores <= 2 || signals.memory <= 2) return 'performance'
  if (integratedGpu) return signals.cores >= 8 && signals.memory >= 8 && pixelLoad < 3_500_000
    ? 'balanced'
    : 'performance'
  if (strongGpu && signals.cores >= 6 && signals.memory >= 8 && pixelLoad < 9_000_000) return 'high'
  if (signals.cores >= 8 && signals.memory >= 8) return 'balanced'
  if (signals.cores <= 4 || signals.memory <= 4) return 'performance'
  return 'balanced'
}

export function detectInitialPerformanceTier(): PerformanceTier {
  if (typeof navigator === 'undefined') return 'balanced'
  return classifyPerformanceSignals({
    cores: navigator.hardwareConcurrency || 4,
    devicePixelRatio: typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1,
    gpuRenderer: detectGpuRenderer(),
    memory: deviceMemory(),
    viewportHeight: typeof window === 'undefined' ? 720 : window.innerHeight,
    viewportWidth: typeof window === 'undefined' ? 1280 : window.innerWidth,
  })
}

export const PERFORMANCE_PROFILES: Record<PerformanceTier, PerformanceProfile> = {
  minimal: {
    actorMountDistance: 24,
    animationFps: 30,
    antialias: true,
    dpr: 0.85,
    dynamicLights: false,
    impactBudget: 6,
    menuFps: 24,
    minimumDpr: 0.7,
    particleRatio: 0.28,
    postprocessMultisampling: 0,
    postprocessResolutionScale: 0.65,
    shadowFps: 0,
    shadowMapSize: 256,
    shadows: false,
    softShadows: false,
    textureAnisotropy: 1,
  },
  performance: {
    actorMountDistance: 32,
    animationFps: 40,
    antialias: true,
    dpr: 1,
    dynamicLights: false,
    impactBudget: 12,
    menuFps: 45,
    minimumDpr: 0.72,
    particleRatio: 0.5,
    postprocessMultisampling: 0,
    postprocessResolutionScale: 0.78,
    shadowFps: 0,
    shadowMapSize: 512,
    shadows: false,
    softShadows: false,
    textureAnisotropy: 2,
  },
  balanced: {
    actorMountDistance: 42,
    animationFps: 60,
    antialias: true,
    dpr: 1.15,
    dynamicLights: true,
    impactBudget: 20,
    menuFps: 60,
    minimumDpr: 0.75,
    particleRatio: 0.85,
    postprocessMultisampling: 0,
    postprocessResolutionScale: 0.6,
    shadowFps: 6,
    shadowMapSize: 512,
    shadows: true,
    softShadows: true,
    textureAnisotropy: 4,
  },
  high: {
    actorMountDistance: 64,
    animationFps: 60,
    antialias: true,
    dpr: 1.35,
    dynamicLights: true,
    impactBudget: 32,
    menuFps: 60,
    minimumDpr: 0.8,
    particleRatio: 1.25,
    postprocessMultisampling: 0,
    postprocessResolutionScale: 0.65,
    shadowFps: 8,
    shadowMapSize: 1024,
    shadows: true,
    softShadows: true,
    textureAnisotropy: 8,
  },
}

interface PerformanceState {
  preference: GraphicsPreference
  tier: PerformanceTier
  hardwareTier: PerformanceTier
  fps: number
  p95FrameMs: number
  longFrames: number
  qualityFactor: number
  renderDpr: number
  setPreference: (preference: GraphicsPreference) => void
  setTier: (tier: PerformanceTier) => void
  setAdaptiveTier: (tier: PerformanceTier) => void
  setQualityFactor: (qualityFactor: number) => void
  setRenderDpr: (renderDpr: number) => void
  reportWindow: (fps: number, p95FrameMs: number) => void
  noteLongFrame: () => void
}

interface PreferenceStorage {
  getItem: (name: string) => string | null
  removeItem: (name: string) => void
  setItem: (name: string, value: string) => void
}

const STORAGE_KEY = 'merbut-graphics-settings'
const memoryValues = new Map<string, string>()
const memoryStorage: PreferenceStorage = {
  getItem: (name) => memoryValues.get(name) ?? null,
  setItem: (name, value) => memoryValues.set(name, value),
  removeItem: (name) => memoryValues.delete(name),
}

const getPerformanceStorage = (): PreferenceStorage => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
  } catch {
    // Sandboxed browsers and the test runner can reject localStorage access.
  }
  return memoryStorage
}

const isPerformanceTier = (value: unknown): value is PerformanceTier => (
  value === 'minimal' || value === 'performance' || value === 'balanced' || value === 'high'
)

function storedPreference(): GraphicsPreference | null {
  try {
    const raw = getPerformanceStorage().getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { state?: { preference?: unknown } }
    const preference = parsed.state?.preference
    return preference === 'auto' || isPerformanceTier(preference) ? preference : null
  } catch {
    return null
  }
}

function persistPreference(preference: GraphicsPreference) {
  getPerformanceStorage().setItem(STORAGE_KEY, JSON.stringify({
    state: { preference },
    version: 1,
  }))
}

export const graphicsPreferenceStorage = {
  clear: () => getPerformanceStorage().removeItem(STORAGE_KEY),
  read: storedPreference,
  readRaw: () => getPerformanceStorage().getItem(STORAGE_KEY),
}

const TIER_ORDER: Record<PerformanceTier, number> = {
  minimal: 0,
  performance: 1,
  balanced: 2,
  high: 3,
}

export function initialRuntimeQuality(tier: PerformanceTier, hardwareTier: PerformanceTier) {
  const difference = Math.max(0, TIER_ORDER[tier] - TIER_ORDER[hardwareTier])
  return [1, 0.72, 0.5, 0.25][difference] ?? 0.25
}

function initialRenderDpr(tier: PerformanceTier, hardwareTier: PerformanceTier) {
  const profile = PERFORMANCE_PROFILES[tier]
  if (TIER_ORDER[tier] <= TIER_ORDER[hardwareTier]) return profile.dpr
  return Math.max(profile.minimumDpr, Math.min(profile.dpr, PERFORMANCE_PROFILES[hardwareTier].dpr))
}

function initialPreferenceQuality(
  preference: GraphicsPreference,
  tier: PerformanceTier,
  hardwareTier: PerformanceTier,
) {
  return preference === 'auto' ? initialRuntimeQuality(tier, hardwareTier) : 1
}

function initialPreferenceDpr(
  preference: GraphicsPreference,
  tier: PerformanceTier,
  hardwareTier: PerformanceTier,
) {
  return preference === 'auto' ? initialRenderDpr(tier, hardwareTier) : PERFORMANCE_PROFILES[tier].dpr
}

const initialPreference = storedPreference() ?? 'auto'
const detectedHardwareTier = detectInitialPerformanceTier()
const detectedInitialTier = initialPreference === 'auto' ? detectedHardwareTier : initialPreference

export const usePerformanceStore = create<PerformanceState>((set) => ({
  preference: initialPreference,
  tier: detectedInitialTier,
  hardwareTier: detectedHardwareTier,
  fps: 60,
  p95FrameMs: 16.7,
  longFrames: 0,
  qualityFactor: initialPreferenceQuality(initialPreference, detectedInitialTier, detectedHardwareTier),
  renderDpr: initialPreferenceDpr(initialPreference, detectedInitialTier, detectedHardwareTier),
  setPreference: (preference) => {
    persistPreference(preference)
    set((state) => {
      const tier = preference === 'auto' ? state.hardwareTier : preference
      return {
        preference,
        tier,
        qualityFactor: initialPreferenceQuality(preference, tier, state.hardwareTier),
        renderDpr: initialPreferenceDpr(preference, tier, state.hardwareTier),
      }
    })
  },
  setTier: (tier) => {
    persistPreference(tier)
    set(() => ({
      preference: tier,
      tier,
      qualityFactor: 1,
      renderDpr: PERFORMANCE_PROFILES[tier].dpr,
    }))
  },
  setAdaptiveTier: (tier) => set((state) => (
    state.preference !== 'auto' || state.tier === tier
      ? state
      : {
          tier,
          qualityFactor: initialRuntimeQuality(tier, state.hardwareTier),
          renderDpr: Math.min(state.renderDpr, initialRenderDpr(tier, state.hardwareTier)),
        }
  )),
  setQualityFactor: (qualityFactor) => set((state) => (
    Math.abs(state.qualityFactor - qualityFactor) < 0.01 ? state : { qualityFactor }
  )),
  setRenderDpr: (renderDpr) => set((state) => (
    Math.abs(state.renderDpr - renderDpr) < 0.01 ? state : { renderDpr }
  )),
  reportWindow: (fps, p95FrameMs) => set((state) => (
    Math.abs(state.fps - fps) < 0.5 && Math.abs(state.p95FrameMs - p95FrameMs) < 0.5
      ? state
      : { fps, p95FrameMs }
  )),
  noteLongFrame: () => set((state) => ({ longFrames: state.longFrames + 1 })),
}))

export function currentPerformanceProfile() {
  return PERFORMANCE_PROFILES[usePerformanceStore.getState().tier]
}

export function currentRuntimeImpactBudget() {
  const state = usePerformanceStore.getState()
  return Math.max(6, Math.round(PERFORMANCE_PROFILES[state.tier].impactBudget * state.qualityFactor))
}

export function runtimeParticleRatio(tier: PerformanceTier, qualityFactor: number) {
  return Math.max(PERFORMANCE_PROFILES.minimal.particleRatio, PERFORMANCE_PROFILES[tier].particleRatio * qualityFactor)
}

export function runtimeAnimationFps(tier: PerformanceTier, qualityFactor: number) {
  return Math.max(PERFORMANCE_PROFILES.minimal.animationFps, Math.round(PERFORMANCE_PROFILES[tier].animationFps * qualityFactor))
}

export function runtimeDynamicShadows(tier: PerformanceTier, qualityFactor: number, enemyCount: number) {
  if (!PERFORMANCE_PROFILES[tier].shadows || qualityFactor < 0.6) return false
  const limit = tier === 'high' ? 18 : tier === 'balanced' ? 10 : 0
  return enemyCount <= limit
}

export function runtimePostprocessing(tier: PerformanceTier, qualityFactor: number, enemyCount: number) {
  if ((tier !== 'balanced' && tier !== 'high') || qualityFactor < 0.6) return false
  return enemyCount <= (tier === 'high' ? 24 : 12)
}

/** Set dressing detail under crowd load: a huge crowd drops the decorative extras first. */
export function runtimeCrowdDetail(enemyCount: number) {
  return { weather: enemyCount >= 40 ? 0.35 : 1, foreground: enemyCount < 40 }
}

export function runtimeDetailedImpacts(tier: PerformanceTier, qualityFactor: number, enemyCount: number) {
  return PERFORMANCE_PROFILES[tier].particleRatio * qualityFactor >= 0.5 && enemyCount <= 24
}

export function runtimeRenderDpr(configuredDpr: number, enemyCount: number, heavyBoss = false) {
  const crowdCap = enemyCount >= 80 ? 1 : enemyCount >= 40 ? 1.1 : enemyCount >= 20 ? 1.2 : configuredDpr
  const bossCap = heavyBoss ? 1 : configuredDpr
  return Math.min(configuredDpr, crowdCap, bossCap)
}
