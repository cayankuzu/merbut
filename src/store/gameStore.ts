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
  teleports: Record<CharacterId, { token: number; x: number }>
  setPlayerPosition: (id: CharacterId, position: Vec3Tuple) => void
  setPlayerRotation: (id: CharacterId, rotation: number) => void
  setPlayerTransform: (id: CharacterId, position: Vec3Tuple, rotation: number) => void
  setCameraX: (position: number) => void
  setPlayerAnimation: (id: CharacterId, animation: AnimationState) => void
  setTogetherWarning: (visible: boolean) => void
  teleportPlayer: (id: CharacterId, x: number) => void
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
  teleports: { ali: { token: 0, x: CHARACTERS.ali.startPosition[0] }, jack: { token: 0, x: CHARACTERS.jack.startPosition[0] } },
  setPlayerPosition: (id, position) =>
    set((state) => {
      const previous = state.positions[id]
      return Math.abs(previous[0] - position[0]) < 0.0001 && Math.abs(previous[1] - position[1]) < 0.0001 && Math.abs(previous[2] - position[2]) < 0.0001
        ? state
        : { positions: { ...state.positions, [id]: position } }
    }),
  setPlayerRotation: (id, rotation) =>
    set((state) => Math.abs(state.rotations[id] - rotation) < 0.0001 ? state : { rotations: { ...state.rotations, [id]: rotation } }),
  setPlayerTransform: (id, position, rotation) => set((state) => {
    const previous = state.positions[id]
    const samePosition = Math.abs(previous[0] - position[0]) < 0.0001 && Math.abs(previous[1] - position[1]) < 0.0001 && Math.abs(previous[2] - position[2]) < 0.0001
    const sameRotation = Math.abs(state.rotations[id] - rotation) < 0.0001
    if (samePosition && sameRotation) return state
    return {
      ...(samePosition ? {} : { positions: { ...state.positions, [id]: position } }),
      ...(sameRotation ? {} : { rotations: { ...state.rotations, [id]: rotation } }),
    }
  }),
  setCameraX: (position) => set((state) => Math.abs(state.cameraX - position) < 0.0001 ? state : { cameraX: position }),
  setPlayerAnimation: (id, animation) =>
    set((state) => ({ animationStates: { ...state.animationStates, [id]: animation } })),
  setTogetherWarning: (visible) =>
    set((state) => (state.togetherWarning === visible ? state : { togetherWarning: visible })),
  teleportPlayer: (id, x) => set((state) => ({
    positions: { ...state.positions, [id]: [x, state.positions[id][1], 0] },
    teleports: { ...state.teleports, [id]: { token: state.teleports[id].token + 1, x } },
  })),
  resetScene: () =>
    set((state) => ({
      positions: initialPositions(),
      rotations: { ali: 0, jack: 0 },
      cameraX: 0,
      animationStates: { ali: 'idle', jack: 'idle' },
      togetherWarning: false,
      teleports: {
        ali: { token: state.teleports.ali.token + 1, x: CHARACTERS.ali.startPosition[0] },
        jack: { token: state.teleports.jack.token + 1, x: CHARACTERS.jack.startPosition[0] },
      },
      resetToken: state.resetToken + 1,
    })),
}))
