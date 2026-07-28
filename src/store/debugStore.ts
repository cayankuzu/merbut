import { create } from 'zustand'
import { CHARACTER_TRANSFORMS } from '../config/characterTransforms'
import { GAME_CONFIG } from '../config/gameConfig'
import type { CharacterId, CharacterTransform } from '../types/character'

interface DebugState {
  transforms: Record<CharacterId, CharacterTransform>
  groundHeight: number
  cameraHeight: number
  cameraDistance: number
  backgroundScale: number
  setTransform: (id: CharacterId, transform: CharacterTransform) => void
  setCameraDistance: (distance: number) => void
  setSceneValues: (values: Pick<DebugState, 'groundHeight' | 'cameraHeight' | 'cameraDistance' | 'backgroundScale'>) => void
}

const copyTransform = (value: CharacterTransform): CharacterTransform => ({
  ...value,
  modelPosition: [...value.modelPosition],
  modelRotation: [...value.modelRotation],
  weapon: {
    alignBlade: value.weapon.alignBlade,
    palmLerp: value.weapon.palmLerp,
    bladeDirection: [...value.weapon.bladeDirection],
    gripPoint: [...value.weapon.gripPoint],
    position: [...value.weapon.position],
    rotation: [...value.weapon.rotation],
    scale: [...value.weapon.scale],
  },
})

function initialCameraDistance() {
  try {
    const saved = Number(window.localStorage.getItem('merbut-camera-distance'))
    if (Number.isFinite(saved)) return Math.min(20.5, Math.max(11.5, saved))
  } catch { /* depolama kapalı olabilir */ }
  return GAME_CONFIG.camera.distance
}

export const useDebugStore = create<DebugState>((set) => ({
  transforms: {
    ali: copyTransform(CHARACTER_TRANSFORMS.ali),
    jack: copyTransform(CHARACTER_TRANSFORMS.jack),
  },
  groundHeight: GAME_CONFIG.world.groundHeight,
  cameraHeight: GAME_CONFIG.camera.height,
  cameraDistance: initialCameraDistance(),
  backgroundScale: GAME_CONFIG.backgroundScale,
  setTransform: (id, transform) =>
    set((state) => ({ transforms: { ...state.transforms, [id]: transform } })),
  setCameraDistance: (distance) => {
    const cameraDistance = Math.min(20.5, Math.max(11.5, distance))
    try { window.localStorage.setItem('merbut-camera-distance', String(cameraDistance)) } catch { /* depolama kapalı olabilir */ }
    set({ cameraDistance })
  },
  setSceneValues: (values) => set(values),
}))
