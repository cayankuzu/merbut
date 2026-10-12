import { useEffect, useState } from 'react'
import { currentLocale, stringsFor, useLocale } from '../i18n'
import type { Locale } from '../i18n/locale'
import { gamepads, PAD_ACTIONS, type PadButton } from './gamepadManager'
import type { PlayerAction } from '../types/controls'

/**
 * Human labels for key codes. When the browser exposes the real keyboard
 * layout (Chromium's Keyboard Map API) we show what is printed on the key,
 * so Turkish Q, Turkish F and US layouts all read correctly.
 */
const SYMBOLS: Record<string, string> = {
  ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
  AltLeft: 'Alt', AltRight: 'Alt Gr', Enter: 'Enter', Escape: 'Esc', Tab: 'Tab', Backspace: '⌫',
  Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']', Minus: '-', Equal: '=',
}

/** Keys whose names are words, so they follow the interface language. */
function namedKey(code: string, locale: Locale) {
  const names = stringsFor(locale).settings
  switch (code) {
    case 'ShiftLeft': return names.keyShiftLeft
    case 'ShiftRight': return names.keyShiftRight
    case 'ControlLeft': return names.keyControlLeft
    case 'ControlRight': return names.keyControlRight
    case 'Space': return names.keySpace
    default: return undefined
  }
}

let layout: Map<string, string> | null = null
/** Upper-case the printed letters by the keyboard's own rules (Turkish keys keep their dotted İ). */
let layoutCase = 'en-US'
const listeners = new Set<() => void>()

async function loadLayout() {
  const keyboardApi = (navigator as Navigator & { keyboard?: { getLayoutMap?: () => Promise<Map<string, string>> } }).keyboard
  if (!keyboardApi?.getLayoutMap) return
  try {
    layout = await keyboardApi.getLayoutMap()
    layoutCase = [...layout.values()].some((printed) => printed.includes('ı')) ? 'tr-TR' : 'en-US'
    listeners.forEach((listener) => listener())
  } catch {
    // Not allowed in this context (e.g. inside an iframe); static labels remain.
  }
}
if (typeof navigator !== 'undefined') void loadLayout()

/** React callers pass the locale from useInputLabels()/useLocale() so they re-render on a language switch. */
export function keyLabel(code: string, locale: Locale = currentLocale()) {
  if (!code) return '—'
  const printed = layout?.get(code)
  if (printed && printed.trim()) return printed.toLocaleUpperCase(layoutCase)
  const named = namedKey(code, locale)
  if (named) return named
  if (SYMBOLS[code]) return SYMBOLS[code]!
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`
  return code
}

/** Gamepad glyphs read the same in every language. */
export const PAD_GLYPHS: Record<PadButton, string> = {
  south: 'A', east: 'B', west: 'X', north: 'Y', lb: 'LB', rb: 'RB', lt: 'LT', rt: 'RT', select: 'Select', start: 'Start', up: '▲', down: '▼', left: '◀', right: '▶',
}

export function padLabel(action: PlayerAction) {
  return PAD_ACTIONS[action].map((button) => PAD_GLYPHS[button]).join(' / ')
}

/** Re-renders when the keyboard layout loads, a gamepad connects or the language changes. */
export function useInputLabels() {
  const locale = useLocale()
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
  return { padCount, locale }
}
