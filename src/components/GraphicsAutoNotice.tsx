import { useEffect, useState } from 'react'
import { useAudioStore } from '../audio/audioStore'
import { useStrings, type Strings } from '../i18n'
import { runtimeRenderDpr, usePerformanceStore, type PerformanceTier } from '../store/performanceStore'
import { useSessionStore } from '../store/sessionStore'
import { safeStorage } from '../utils/safeStorage'

/** The calibration report is a first-launch courtesy, not a toast on every boot. */
const SEEN_KEY = 'merbut-graphics-notice-seen'
const alreadySeen = () => {
  try {
    return safeStorage().getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}
const markSeen = () => {
  try {
    safeStorage().setItem(SEEN_KEY, '1')
  } catch {
    // storage may be blocked; the notice then simply shows again next launch
  }
}

const TIER_NAME_KEYS: Record<PerformanceTier, keyof Strings['menu'] & `tier${string}`> = {
  minimal: 'tierMinimal',
  performance: 'tierPerformance',
  balanced: 'tierBalanced',
  high: 'tierHigh',
}

export function GraphicsAutoNotice() {
  const s = useStrings()
  const [visible, setVisible] = useState(() => !alreadySeen())
  const preference = usePerformanceStore((state) => state.preference)
  const qualityFactor = usePerformanceStore((state) => state.qualityFactor)
  const renderDpr = usePerformanceStore((state) => state.renderDpr)
  const tier = usePerformanceStore((state) => state.tier)
  const enemyCount = useSessionStore((state) => state.enemies.length)
  const heavyBoss = useSessionStore((state) => state.enemies.some((enemy) => enemy.boss && enemy.animation !== 'dead'))
  const effectiveDpr = runtimeRenderDpr(renderDpr, enemyCount, heavyBoss)
  const openSettings = useAudioStore((state) => state.openPanel)

  useEffect(() => {
    if (!visible) return
    markSeen()
    const timer = window.setTimeout(() => setVisible(false), 9_000)
    return () => window.clearTimeout(timer)
  }, [visible])

  if (!visible) return null
  return (
    <aside className="graphics-auto-notice" role="status" aria-live="polite">
      <i aria-hidden="true" />
      <div>
        <small>{s.menu.graphicsCalibrated}</small>
        <strong>{preference === 'auto' ? s.menu.graphicsAutoApplied : s.menu.graphicsSavedApplied}</strong>
        <span>{s.menu.graphicsDetails(s.menu[TIER_NAME_KEYS[tier]], effectiveDpr.toFixed(2), Math.round(qualityFactor * 100))}</span>
      </div>
      <button type="button" onClick={() => { openSettings(); setVisible(false) }}>{s.menu.graphicsEdit}</button>
      <button className="graphics-auto-notice__close" type="button" aria-label={s.menu.graphicsClose} onClick={() => setVisible(false)}>×</button>
    </aside>
  )
}
