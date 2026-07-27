import { ASSET_PATHS } from './assetPaths'

function collectPaths(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(collectPaths)
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectPaths)
  return []
}

const allAssetPaths = [...new Set(collectPaths(ASSET_PATHS))]

export const MODEL_ASSETS = allAssetPaths.filter((path) => path.endsWith('.glb'))
export const BACKGROUND_ASSETS = allAssetPaths.filter((path) => /\.(?:jpe?g|png|webp)$/i.test(path))

