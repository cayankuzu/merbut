export const PLAYER_ACTIONS = ['left', 'right', 'jump', 'attack', 'ability', 'dash', 'rotateLeft', 'rotateRight'] as const
export type PlayerAction = typeof PLAYER_ACTIONS[number]
export type PlayerBindings = Record<PlayerAction, string>
