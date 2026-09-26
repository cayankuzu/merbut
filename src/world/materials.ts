import { DoubleSide, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, MeshStandardMaterial, type Material } from 'three'
import type { SurfaceKind } from './kit'

/**
 * One material per surface family, shared by every biome. Colour lives in the
 * geometry (vertex colours), so ten biomes still use only eight materials.
 * Large matte surfaces use Lambert shading: it looks the same on painted,
 * flat-shaded shapes and costs far less per pixel than PBR on integrated GPUs.
 * Wet and icy surfaces use Phong highlights; only small metal props pay for PBR.
 */
export const SURFACES: Record<SurfaceKind, Material> = {
  stone: new MeshLambertMaterial({ vertexColors: true, flatShading: true }),
  metal: new MeshStandardMaterial({ vertexColors: true, roughness: 0.36, metalness: 0.78 }),
  wood: new MeshLambertMaterial({ vertexColors: true }),
  glow: new MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
  gloss: new MeshPhongMaterial({ vertexColors: true, shininess: 90, specular: 0x6b5a60 }),
  foliage: new MeshLambertMaterial({ vertexColors: true, side: DoubleSide, flatShading: true }),
  silhouette: new MeshBasicMaterial({ vertexColors: true, fog: false }),
  ice: new MeshPhongMaterial({ vertexColors: true, shininess: 120, specular: 0xbfe9ff, transparent: true, opacity: 0.82 }),
}
