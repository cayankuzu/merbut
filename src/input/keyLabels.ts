import { useEffect, useState } from 'react'
import { gamepads, PAD_ACTIONS, type PadButton } from './gamepadManager'
import type { PlayerAction } from '../types/controls'

/**
 * Human labels for key codes. When the browser exposes the real keyboard
 * layout (Chromium's Keyboard Map API) we show what is printed on the key,
 * so Turkish Q, Turkish F and US layouts all read correctly.
 */
const STATIC: Record<string, string> = {
  ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
  ShiftLeft: 'Sol Shift', ShiftRight: 'Sağ Shift', ControlLeft: 'Sol Ctrl', ControlRight: 'Sağ Ctrl',
  AltLeft: 'Alt', AltRight: 'Alt Gr', Space: 'Boşluk', Enter: 'Enter', Escape: 'Esc', Tab: 'Tab', Backspace: '⌫',
  Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']', Minus: '-', Equal: '=',
}

let layout: Map<string, string> | null = null
const listeners = new Set<() => void>()

async function loadLayout() {
  const keyboardApi = (navigator as Navigator & { keyboard?: { getLayoutMap?: () => Promise<Map<string, string>> } }).keyboard
  if (!keyboardApi?.getLayoutMap) return
  try {
    layout = await keyboardApi.getLayoutMap()
    listeners.forEach((listener) => listener())
  } catch {
    // Not allowed in this context (e.g. inside an iframe); static labels remain.
  }
}
if (typeof navigator !== 'undefined') void loadLayout()

export function keyLabel(code: string) {
  if (!code) return '—'
  const printed = layout?.get(code)
  if (printed && printed.trim()) return printed.toLocaleUpperCase('tr-TR')
  if (STATIC[code]) return STATIC[code]!
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`
  return code
}

export const PAD_GLYPHS: Record<PadButton, string> = {
  south: 'A', east: 'B', west: 'X', north: 'Y', lb: 'LB', rb: 'RB', lt: 'LT', rt: 'RT', select: 'Select', start: 'Start', up: '▲', down: '▼', left: '◀', right: '▶',
}

export function padLabel(action: PlayerAction) {
  return PAD_ACTIONS[action].map((button) => PAD_GLYPHS[button]).join(' / ')
}

/** Re-renders when the keyboard layout loads or a gamepad connects. */
export function useInputLabels() {
  const [, setVersion] = useState(0)
  const [padCount, setPadCount] = useState(() => gamepads.count())
  useEffect(() => {
    const refresh = () => setVersion((version) => version + 1)
    listeners.add(refresh)
    const onPad = () => {
      gamepads.poll()
      setPadCount(gamepads.count())
    }
    window.addEventListener('gamepadconnected', onPad)
    window.addEventListener('gamepaddisconnected', onPad)
    return () => {
      listeners.delete(refresh)
      window.removeEventListener('gamepadconnected', onPad)
      window.removeEventListener('gamepaddisconnected', onPad)
    }
  }, [])
  return { padCount }
}
