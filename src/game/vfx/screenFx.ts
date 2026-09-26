import { useSettingsStore } from '../../store/settingsStore'

/**
 * Full-screen punctuation, used sparingly: the anime "impact frame" (one
 * stark monochrome beat on a decisive blow) and speed lines for a perfect
 * dodge. Both respect the reduced-flashes setting.
 */
let impactTimer = 0
let speedTimer = 0

function canvasShell() {
  return document.querySelector<HTMLElement>('.game-canvas')
}

export function impactFrame(ms = 70) {
  if (useSettingsStore.getState().reduceFlashes) return
  const canvas = canvasShell()
  if (!canvas) return
  canvas.classList.add('is-impact-frame')
  window.clearTimeout(impactTimer)
  impactTimer = window.setTimeout(() => canvas.classList.remove('is-impact-frame'), ms)
}

export function speedLines(color = '#dff3ff') {
  if (useSettingsStore.getState().reduceFlashes) return
  let layer = document.querySelector<HTMLElement>('.speed-lines')
  if (!layer) {
    layer = document.createElement('div')
    layer.className = 'speed-lines'
    layer.setAttribute('aria-hidden', 'true')
    document.querySelector('.game-shell')?.appendChild(layer)
  }
  layer.style.setProperty('--speed-color', color)
  layer.classList.remove('is-active')
  void layer.offsetWidth
  layer.classList.add('is-active')
  window.clearTimeout(speedTimer)
  speedTimer = window.setTimeout(() => layer?.classList.remove('is-active'), 420)
}
