/**
 * DEV-only switches for performance bisection, e.g. `?lab=weather,dressing`.
 * Always false in production builds.
 */
const flags = new Set<string>(
  import.meta.env.DEV && typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('lab') ?? '').split(',').filter(Boolean)
    : [],
)

export const labOff = (feature: string) => flags.has(feature)
