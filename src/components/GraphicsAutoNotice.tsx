import { useEffect, useState } from 'react'
import { useAudioStore } from '../audio/audioStore'
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

const TIER_NAMES: Record<PerformanceTier, string> = {
  minimal: 'AKICI',
  performance: 'ORTA',
  balanced: 'YÜKSEK',
  high: 'ULTRA',
}

export function GraphicsAutoNotice() {
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
        <small>GRAFİK KALİBRASYONU TAMAMLANDI</small>
        <strong>{preference === 'auto' ? 'Cihazınız için en akıcı profil otomatik uygulandı.' : 'Kayıtlı grafik tercihiniz uygulandı.'}</strong>
        <span>{TIER_NAMES[tier]} · İç çözünürlük {effectiveDpr.toFixed(2)}× · Adaptif bütçe %{Math.round(qualityFactor * 100)} · Değiştirmek için Ayarlar’ı açın.</span>
      </div>
      <button type="button" onClick={() => { openSettings(); setVisible(false) }}>GRAFİĞİ DÜZENLE</button>
      <button className="graphics-auto-notice__close" type="button" aria-label="Grafik bildirimini kapat" onClick={() => setVisible(false)}>×</button>
    </aside>
  )
}
