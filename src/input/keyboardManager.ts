import { GAME_KEY_CODES } from './playerBindings'

class KeyboardManager {
  private pressed = new Set<string>()
  private justPressed = new Set<string>()
  private listening = false

  private onKeyDown = (event: KeyboardEvent) => {
    if (GAME_KEY_CODES.has(event.code)) event.preventDefault()
    if (!this.pressed.has(event.code)) this.justPressed.add(event.code)
    this.pressed.add(event.code)
  }

  private onKeyUp = (event: KeyboardEvent) => {
    if (GAME_KEY_CODES.has(event.code)) event.preventDefault()
    this.pressed.delete(event.code)
  }

  private onBlur = () => this.clear()

  start() {
    if (this.listening) return
    window.addEventListener('keydown', this.onKeyDown, { passive: false })
    window.addEventListener('keyup', this.onKeyUp, { passive: false })
    window.addEventListener('blur', this.onBlur)
    this.listening = true
  }

  stop() {
    if (!this.listening) return
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    this.clear()
    this.listening = false
  }

  isPressed(code: string) {
    return this.pressed.has(code)
  }

  consumePress(code: string) {
    const value = this.justPressed.has(code)
    this.justPressed.delete(code)
    return value
  }

  clear() {
    this.pressed.clear()
    this.justPressed.clear()
  }
}

export const keyboard = new KeyboardManager()
