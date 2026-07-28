import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { PERFORMANCE_PROFILES, type PerformanceTier } from '../store/performanceStore'

interface AdaptiveVisualGradeProps {
  qualityFactor: number
  tier: Extract<PerformanceTier, 'balanced' | 'high'>
}

/**
 * Costlier color finishing is isolated in its own lazy chunk. Low-end tiers
 * never download or execute the post-processing pipeline.
 */
export function AdaptiveVisualGrade({ qualityFactor, tier }: AdaptiveVisualGradeProps) {
  const high = tier === 'high'
  const profile = PERFORMANCE_PROFILES[tier]
  const multisampling = qualityFactor >= 0.85
    ? profile.postprocessMultisampling
    : qualityFactor >= 0.7 ? 2 : 0
  return (
    <EffectComposer
      enabled={qualityFactor >= 0.6}
      multisampling={multisampling}
      resolutionScale={profile.postprocessResolutionScale * (0.72 + qualityFactor * 0.28)}
    >
      <Bloom
        intensity={(high ? 0.46 : 0.28) * (0.72 + qualityFactor * 0.28)}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.3}
        mipmapBlur={high}
      />
      <Vignette offset={0.18} darkness={high ? 0.48 : 0.34} eskil={false} />
    </EffectComposer>
  )
}
