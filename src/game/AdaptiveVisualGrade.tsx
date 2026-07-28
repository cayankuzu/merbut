import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import type { PerformanceTier } from '../store/performanceStore'

interface AdaptiveVisualGradeProps {
  tier: Extract<PerformanceTier, 'balanced' | 'high'>
}

/**
 * Costlier color finishing is isolated in its own lazy chunk. Low-end tiers
 * never download or execute the post-processing pipeline.
 */
export function AdaptiveVisualGrade({ tier }: AdaptiveVisualGradeProps) {
  const high = tier === 'high'
  return (
    <EffectComposer multisampling={0} resolutionScale={high ? 0.92 : 0.72}>
      <Bloom
        intensity={high ? 0.42 : 0.24}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.3}
        mipmapBlur={high}
      />
      <Vignette offset={0.18} darkness={high ? 0.48 : 0.34} eskil={false} />
    </EffectComposer>
  )
}
