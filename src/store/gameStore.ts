import { create } from 'zustand'
import type { CharacterId, Vec3Tuple } from '../types/character'
import type { AnimationState } from '../types/animation'
import { CHARACTERS } from '../config/gameConfig'

interface GameState {
  positions: Record<CharacterId, Vec3Tuple>
  rotations: Record<CharacterId, number>
  cameraX: number
  animationStates: Record<CharacterId, AnimationState>
  togetherWarning: boolean
  resetToken: number
  setPlayerPosition: (id: CharacterId, position: Vec3Tuple) => void
  setPlayerRotation: (id: CharacterId, rotation: number) => void
  setCameraX: (position: number) => void
  setPlayerAnimation: (id: CharacterId, animation: AnimationState) => void
  setTogetherWarning: (visible: boolean) => void
  resetScene: () => void
}

const initialPositions = (): Record<CharacterId, Vec3Tuple> => ({
  ali: [...CHARACTERS.ali.startPosition],
  jack: [...CHARACTERS.jack.startPosition],
})

export const useGameStore = create<GameState>((set) => ({
  positions: initialPositions(),
  rotations: { ali: 0, jack: 0 },
  cameraX: 0,
  animationStates: { ali: 'idle', jack: 'idle' },
  togetherWarning: false,
  resetToken: 0,
  setPlayerPosition: (id, position) =>
    set((state) => ({ positions: { ...state.positions, [id]: position } })),
  setPlayerRotation: (id, rotation) =>
    set((state) => ({ rotations: { ...state.rotations, [id]: rotation } })),
  setCameraX: (position) => set({ cameraX: position }),
  setPlayerAnimation: (id, animation) =>
    set((state) => ({ animationStates: { ...state.animationStates, [id]: animation } })),
  setTogetherWarning: (visible) =>
    set((state) => (state.togetherWarning === visible ? state : { togetherWarning: visible })),
  resetScene: () =>
    set((state) => ({
      positions: initialPositions(),
      rotations: { ali: 0, jack: 0 },
      cameraX: 0,
      animationStates: { ali: 'idle', jack: 'idle' },
      togetherWarning: false,
      resetToken: state.resetToken + 1,
    })),
}))
