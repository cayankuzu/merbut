import { CHARACTERS } from '../config/gameConfig'

export const PLAYER_BINDINGS = {
  ali: CHARACTERS.ali.bindings,
  jack: CHARACTERS.jack.bindings,
} as const

export const GAME_KEY_CODES = new Set(
  Object.values(PLAYER_BINDINGS).flatMap((bindings) => Object.values(bindings)),
)
