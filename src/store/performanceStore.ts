import { create } from 'zustand'

export type PerformanceTier = 'performance' | 'balanced' | 'high'

export interface PerformanceProfile {
  dpr: number
  impactBudget: number
  particleRatio: number
  shadowFps: number
  shadowMapSize: 256 | 512 | 1024
  shadows: boolean
}

const deviceMemory = () => {
  if (typeof navigator === 'undefined') return 4
  return (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
}

export function isSafariWebkitEngine() {
  if (typeof navigator === 'undefined') return false
  return /Safari/i.test(navigator.userAgent) && !/(Chrome|Chromium|Edg)/i.test(navigator.userAgent)
}

export function detectInitialPerformanceTier(): PerformanceTier {
  if (typeof navigator === 'undefined') return 'balanced'
  const cores = navigator.hardwareConcurrency || 4
  const memory = deviceMemory()
  const userAgent = navigator.userAgent
  const conservativeEngine = /Firefox/i.test(userAgent) || isSafariWebkitEngine()
  if (conservativeEngine) return 'performance'
  if (cores <= 2 || memory <= 2) return 'performance'
  if (cores >= 8 && memory >= 8) return 'high'
  return 'balanced'
}

export const PERFORMANCE_PROFILES: Record<PerformanceTier, PerformanceProfile> = {
  performance: { dpr: 0.62, impactBudget: 10, particleRatio: 0.38, shadowFps: 0, shadowMapSize: 256, shadows: false },
  balanced: { dpr: 0.82, impactBudget: 15, particleRatio: 0.68, shadowFps: 12, shadowMapSize: 512, shadows: true },
  high: { dpr: 1, impactBudget: 22, particleRatio: 1, shadowFps: 24, shadowMapSize: 1024, shadows: true },
}

interface PerformanceState {
  tier: PerformanceTier
  fps: number
  p95FrameMs: number
  longFrames: number
  setTier: (tier: PerformanceTier) => void
  reportWindow: (fps: number, p95FrameMs: number) => void
  noteLongFrame: () => void
}

export const usePerformanceStore = create<PerformanceState>((set) => ({
  tier: detectInitialPerformanceTier(),
  fps: 60,
  p95FrameMs: 16.7,
  longFrames: 0,
  setTier: (tier) => set((state) => state.tier === tier ? state : { tier }),
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
