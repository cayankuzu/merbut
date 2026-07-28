import { useEffect, useState } from 'react'
import { useAudioStore } from '../audio/audioStore'
import { runtimeRenderDpr, usePerformanceStore, type PerformanceTier } from '../store/performanceStore'
import { useSessionStore } from '../store/sessionStore'

const TIER_NAMES: Record<PerformanceTier, string> = {
  minimal: 'AKICI',
  performance: 'ORTA',
  balanced: 'YÜKSEK',
  high: 'ULTRA',
}

export function GraphicsAutoNotice() {
  const [visible, setVisible] = useState(true)
  const preference = usePerformanceStore((state) => state.preference)
  const qualityFactor = usePerformanceStore((state) => state.qualityFactor)
  const renderDpr = usePerformanceStore((state) => state.renderDpr)
  const tier = usePerformanceStore((state) => state.tier)
  const enemyCount = useSessionStore((state) => state.enemies.length)
  const heavyBoss = useSessionStore((state) => state.enemies.some((enemy) => enemy.boss && enemy.animation !== 'dead'))
  const effectiveDpr = runtimeRenderDpr(renderDpr, enemyCount, heavyBoss)
  const openSettings = useAudioStore((state) => state.openPanel)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 9_000)
    return () => window.clearTimeout(timer)
  }, [])

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
