import type { PlayerAction } from '../types/controls'

/**
 * Standard-mapping gamepad support (Xbox / PlayStation / most USB pads).
 * Polled once per animation frame; exposes "held" and "just pressed" per pad.
 */
export type PadButton = 'south' | 'east' | 'west' | 'north' | 'lb' | 'rb' | 'lt' | 'rt' | 'select' | 'start' | 'up' | 'down' | 'left' | 'right'

const BUTTON_INDEX: Record<PadButton, number> = {
  south: 0, east: 1, west: 2, north: 3, lb: 4, rb: 5, lt: 6, rt: 7, select: 8, start: 9, up: 12, down: 13, left: 14, right: 15,
}

export const PAD_ACTIONS: Record<PlayerAction, PadButton[]> = {
  left: ['left'],
  right: ['right'],
  jump: ['south', 'up'],
  attack: ['west'],
  ability: ['north'],
  dash: ['east', 'rt'],
  rotateLeft: ['lb'],
  rotateRight: ['rb'],
}

const STICK_DEADZONE = 0.42

interface PadSnapshot {
  held: Set<PadButton>
  pressed: Set<PadButton>
  axisX: number
  axisY: number
  id: string
}

let snapshots: PadSnapshot[] = []
let connected = 0

function readPad(pad: Gamepad, previous: PadSnapshot | undefined): PadSnapshot {
  const held = new Set<PadButton>()
  for (const [name, index] of Object.entries(BUTTON_INDEX) as [PadButton, number][]) {
    const button = pad.buttons[index]
    if (button && (button.pressed || button.value > 0.5)) held.add(name)
  }
  const axisX = pad.axes[0] ?? 0
  const axisY = pad.axes[1] ?? 0
  if (axisX < -STICK_DEADZONE) held.add('left')
  if (axisX > STICK_DEADZONE) held.add('right')
  if (axisY < -STICK_DEADZONE * 1.4) held.add('up')
  if (axisY > STICK_DEADZONE * 1.4) held.add('down')
  const pressed = new Set<PadButton>()
  held.forEach((button) => { if (!previous?.held.has(button)) pressed.add(button) })
  // Keep unconsumed presses until the game reads them.
  previous?.pressed.forEach((button) => pressed.add(button))
  return { held, pressed, axisX, axisY, id: pad.id }
}

export const gamepads = {
  poll() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return
    const pads = Array.from(navigator.getGamepads()).filter((pad): pad is Gamepad => Boolean(pad && pad.connected))
    snapshots = pads.map((pad, index) => readPad(pad, snapshots[index]))
    connected = pads.length
  },
  count: () => connected,
  isHeld(slot: number, button: PadButton) {
    return snapshots[slot]?.held.has(button) ?? false
  },
  consume(slot: number, button: PadButton) {
    const snapshot = snapshots[slot]
    if (!snapshot?.pressed.has(button)) return false
    snapshot.pressed.delete(button)
    return true
  },
  /** Any pad pressed this button (used by menus and "press any key"). */
  consumeAny(button: PadButton) {
    return snapshots.some((_, slot) => this.consume(slot, button))
  },
  anyPressed() {
    return snapshots.some((snapshot) => snapshot.pressed.size > 0)
  },
  clearPresses() {
    snapshots.forEach((snapshot) => snapshot.pressed.clear())
  },
  name(slot: number) {
    return snapshots[slot]?.id ?? ''
  },
  vibrate(slot: number, strength: number, durationMs: number) {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return
    const pad = Array.from(navigator.getGamepads()).filter(Boolean)[slot] as (Gamepad & { vibrationActuator?: { playEffect?: (type: string, params: object) => Promise<unknown> } }) | undefined
    void pad?.vibrationActuator?.playEffect?.('dual-rumble', {
      duration: durationMs,
      strongMagnitude: Math.min(1, strength),
      weakMagnitude: Math.min(1, strength * 0.7),
    }).catch(() => undefined)
  },
}
