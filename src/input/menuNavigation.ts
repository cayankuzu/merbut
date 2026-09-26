import { ACTIVE_PHASES, useSessionStore } from '../store/sessionStore'
import { gamepads, type PadButton } from './gamepadManager'

/**
 * Console-style menu navigation: d-pad / stick / arrow keys move focus to the
 * nearest control in that direction, A (south) activates it, B goes back.
 */
type Direction = 'up' | 'down' | 'left' | 'right'

const FOCUSABLE = 'button:not([disabled]), [role="tab"], input[type="range"], select, a[href]'

function visibleControls() {
  return Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) => {
    if (element.closest('[aria-hidden="true"], [hidden], .is-inert')) return false
    const rect = element.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight
  })
}

/** Menus that open on top (dialogs) own navigation while they are open. */
function navigationScope(controls: HTMLElement[]) {
  const dialog = document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]:not([aria-hidden="true"])')
  return dialog ? controls.filter((control) => dialog.contains(control)) : controls
}

export function moveFocus(direction: Direction) {
  const controls = navigationScope(visibleControls())
  if (controls.length === 0) return
  const current = document.activeElement as HTMLElement | null
  if (!current || !controls.includes(current)) {
    const preferred = controls.find((control) => control.classList.contains('menu-primary')) ?? controls[0]!
    preferred.focus()
    return
  }
  if (current instanceof HTMLInputElement && current.type === 'range' && (direction === 'left' || direction === 'right')) {
    stepRange(current, direction === 'right' ? 1 : -1)
    return
  }
  const from = current.getBoundingClientRect()
  const fromX = from.left + from.width / 2
  const fromY = from.top + from.height / 2
  let best: HTMLElement | null = null
  let bestScore = Infinity
  for (const control of controls) {
    if (control === current) continue
    const rect = control.getBoundingClientRect()
    const dx = rect.left + rect.width / 2 - fromX
    const dy = rect.top + rect.height / 2 - fromY
    const along = direction === 'up' ? -dy : direction === 'down' ? dy : direction === 'left' ? -dx : dx
    if (along <= 4) continue
    const across = direction === 'up' || direction === 'down' ? Math.abs(dx) : Math.abs(dy)
    const score = along + across * 2.2
    if (score < bestScore) {
      bestScore = score
      best = control
    }
  }
  best?.focus()
}

function stepRange(input: HTMLInputElement, sign: 1 | -1) {
  const step = Number(input.step) || 1
  const span = Number(input.max) - Number(input.min)
  const delta = Math.max(step, span / 20) * sign
  const next = Math.min(Number(input.max), Math.max(Number(input.min), Number(input.value) + delta))
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, String(next))
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function dispatchEscape() {
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true }))
}

const REPEAT_DELAY_MS = 360
const REPEAT_RATE_MS = 120
let heldDirection: Direction | null = null
let nextRepeatAt = 0

function inCombat() {
  return ACTIVE_PHASES.includes(useSessionStore.getState().phase)
}

function padDirection(): Direction | null {
  for (const direction of ['up', 'down', 'left', 'right'] as const) {
    for (let slot = 0; slot < gamepads.count(); slot += 1) if (gamepads.isHeld(slot, direction as PadButton)) return direction
  }
  return null
}

function frame(now: number) {
  gamepads.poll()
  if (gamepads.consumeAny('start')) dispatchEscape()
  if (!inCombat()) {
    const direction = padDirection()
    if (direction && (direction !== heldDirection || now >= nextRepeatAt)) {
      moveFocus(direction)
      nextRepeatAt = now + (direction === heldDirection ? REPEAT_RATE_MS : REPEAT_DELAY_MS)
    }
    heldDirection = direction
    if (gamepads.consumeAny('south')) {
      const active = document.activeElement as HTMLElement | null
      if (active && active !== document.body) active.click()
      else window.dispatchEvent(new CustomEvent('merbut-any-input'))
    }
    if (gamepads.consumeAny('east')) dispatchEscape()
    gamepads.clearPresses()
  }
  requestAnimationFrame(frame)
}

function onKeyDown(event: KeyboardEvent) {
  if (inCombat()) return
  const map: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }
  const direction = map[event.code]
  if (!direction) return
  const active = document.activeElement
  if (active instanceof HTMLInputElement && active.type === 'range' && (direction === 'left' || direction === 'right')) return
  event.preventDefault()
  moveFocus(direction)
}

let started = false
export function startInputLoop() {
  if (started || typeof window === 'undefined') return
  started = true
  window.addEventListener('keydown', onKeyDown)
  requestAnimationFrame(frame)
}
