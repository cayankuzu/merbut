import { create } from 'zustand'
import type { CharacterId, Vec3Tuple } from '../types/character'
import type { AnimationState } from '../types/animation'
import { CHARACTERS } from '../config/gameConfig'

export type AttackStep = 1 | 2 | 3

interface GameState {
  positions: Record<CharacterId, Vec3Tuple>
  rotations: Record<CharacterId, number>
  cameraX: number
  animationStates: Record<CharacterId, AnimationState>
  attackSequences: Record<CharacterId, number>
  /** Position of the latest attack in the three-hit chain (3 = spinning finisher). */
  attackSteps: Record<CharacterId, AttackStep>
  togetherWarning: boolean
  resetToken: number
  teleports: Record<CharacterId, { token: number; x: number }>
  /** One-shot velocity impulses (tide, lava) the character controller applies once. */
  impulses: Record<CharacterId, { token: number; vx: number; vy: number }>
  setPlayerPosition: (id: CharacterId, position: Vec3Tuple) => void
  setPlayerRotation: (id: CharacterId, rotation: number) => void
  setPlayerTransform: (id: CharacterId, position: Vec3Tuple, rotation: number) => void
  setCameraX: (position: number) => void
  setPlayerAnimation: (id: CharacterId, animation: AnimationState) => void
  triggerPlayerAttack: (id: CharacterId, step?: AttackStep) => void
  setTogetherWarning: (visible: boolean) => void
  teleportPlayer: (id: CharacterId, x: number) => void
  pushPlayer: (id: CharacterId, vx: number, vy: number) => void
  /** Resets heroes and camera; `originX` places them at a chapter's start. */
  resetScene: (originX?: number) => void
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
  attackSequences: { ali: 0, jack: 0 },
  attackSteps: { ali: 1, jack: 1 },
  togetherWarning: false,
  resetToken: 0,
  teleports: { ali: { token: 0, x: CHARACTERS.ali.startPosition[0] }, jack: { token: 0, x: CHARACTERS.jack.startPosition[0] } },
  impulses: { ali: { token: 0, vx: 0, vy: 0 }, jack: { token: 0, vx: 0, vy: 0 } },
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
    set((state) => state.animationStates[id] === animation
      ? state
      : { animationStates: { ...state.animationStates, [id]: animation } }),
  triggerPlayerAttack: (id, step = 1) => set((state) => ({
    attackSteps: { ...state.attackSteps, [id]: step },
    animationStates: state.animationStates[id] === 'attack'
      ? state.animationStates
      : { ...state.animationStates, [id]: 'attack' },
    attackSequences: { ...state.attackSequences, [id]: state.attackSequences[id] + 1 },
  })),
  setTogetherWarning: (visible) =>
    set((state) => (state.togetherWarning === visible ? state : { togetherWarning: visible })),
  teleportPlayer: (id, x) => set((state) => ({
    positions: { ...state.positions, [id]: [x, state.positions[id][1], 0] },
    teleports: { ...state.teleports, [id]: { token: state.teleports[id].token + 1, x } },
  })),
  pushPlayer: (id, vx, vy) => set((state) => ({
    impulses: { ...state.impulses, [id]: { token: state.impulses[id].token + 1, vx, vy } },
  })),
  resetScene: (originX = 0) =>
    set((state) => ({
      positions: { ali: [CHARACTERS.ali.startPosition[0] + originX, 0, 0], jack: [CHARACTERS.jack.startPosition[0] + originX, 0, 0] },
      rotations: { ali: 0, jack: 0 },
      cameraX: originX,
      animationStates: { ali: 'idle', jack: 'idle' },
      attackSequences: { ali: 0, jack: 0 },
      attackSteps: { ali: 1, jack: 1 },
      togetherWarning: false,
      teleports: {
        ali: { token: state.teleports.ali.token + 1, x: CHARACTERS.ali.startPosition[0] + originX },
        jack: { token: state.teleports.jack.token + 1, x: CHARACTERS.jack.startPosition[0] + originX },
      },
      resetToken: state.resetToken + 1,
    })),
}))
