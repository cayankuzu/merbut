import { useSettingsStore } from '../store/settingsStore'
import type { CharacterId } from '../types/character'
import type { PlayerAction } from '../types/controls'
import { gamepads, PAD_ACTIONS } from './gamepadManager'
import { keyboard } from './keyboardManager'

/**
 * The only input API gameplay code uses. Each hero reads its own keyboard
 * bindings plus its assigned gamepad, so either device (or both) just works.
 */
export const playerInput = {
  isDown(player: CharacterId, action: PlayerAction) {
    const settings = useSettingsStore.getState()
    if (keyboard.isPressed(settings.bindings[player][action])) return true
    const slot = settings.gamepadSlots[player]
    return PAD_ACTIONS[action].some((button) => gamepads.isHeld(slot, button))
  },
  consumePress(player: CharacterId, action: PlayerAction) {
    const settings = useSettingsStore.getState()
    const code = settings.bindings[player][action]
    const fromKeyboard = code !== '' && keyboard.consumePress(code)
    const slot = settings.gamepadSlots[player]
    const fromPad = PAD_ACTIONS[action].some((button) => gamepads.consume(slot, button))
    return fromKeyboard || fromPad
  },
  clear() {
    keyboard.clear()
    gamepads.clearPresses()
  },
}
