import { startTransition } from 'react'
import {
  type GraphicsPreference,
  type PerformanceTier,
  runtimeRenderDpr,
  usePerformanceStore,
} from '../store/performanceStore'
import { useSessionStore } from '../store/sessionStore'

interface GraphicsOption {
  detail: string
  id: PerformanceTier
  label: string
  recommendation: string
}

const GRAPHICS_OPTIONS: readonly GraphicsOption[] = [
  {
    id: 'minimal',
    label: 'DÜŞÜK',
    detail: '0,50–0,75× dinamik çözünürlük · gölgesiz · akıcı animasyon',
    recommendation: '2 çekirdek · 4 GB RAM · Intel HD veya eski mobil GPU',
  },
  {
    id: 'performance',
    label: 'ORTA',
    detail: '0,55–1,00× dinamik çözünürlük · kenar yumuşatma · dengeli kalabalık',
    recommendation: '4 çekirdek · 8 GB RAM · Intel UHD veya AMD Vega',
  },
  {
    id: 'balanced',
    label: 'YÜKSEK',
    detail: '0,60–1,15× dinamik çözünürlük · yumuşak temas gölgesi · yoğun efekt bütçesi',
    recommendation: '6 çekirdek · 8-16 GB RAM · GTX 1650 veya RX 570',
  },
  {
    id: 'high',
    label: 'ULTRA',
    detail: '0,60–1,35× dinamik çözünürlük · yumuşak temas gölgesi · yüksek parçacık · yakın tam modeller',
    recommendation: '8+ çekirdek · 16 GB RAM · RTX 2060, RX 6600 veya Apple M1+',
  },
]

const TIER_LABELS: Record<PerformanceTier, string> = {
  minimal: 'DÜŞÜK',
  performance: 'ORTA',
  balanced: 'YÜKSEK',
  high: 'ULTRA',
}

export function GraphicsSettingsPanel() {
  const preference = usePerformanceStore((state) => state.preference)
  const tier = usePerformanceStore((state) => state.tier)
  const fps = usePerformanceStore((state) => state.fps)
  const p95FrameMs = usePerformanceStore((state) => state.p95FrameMs)
  const renderDpr = usePerformanceStore((state) => state.renderDpr)
  const enemyCount = useSessionStore((state) => state.enemies.length)
  const heavyBoss = useSessionStore((state) => state.enemies.some((enemy) => enemy.boss && enemy.animation !== 'dead'))
  const effectiveDpr = runtimeRenderDpr(renderDpr, enemyCount, heavyBoss)
  const setPreference = usePerformanceStore((state) => state.setPreference)

  const selectPreference = (nextPreference: GraphicsPreference) => {
    startTransition(() => setPreference(nextPreference))
  }

  return (
    <section className="graphics-settings" aria-labelledby="graphics-settings-title">
      <div className="graphics-settings__heading">
        <div>
          <small>GÖRÜNTÜ KALİTESİ</small>
          <h3 id="graphics-settings-title">Grafik profili</h3>
        </div>
        <output title={`95. yüzdelik kare süresi: ${p95FrameMs.toFixed(1)} ms`}>
          {Math.round(fps)} FPS · {TIER_LABELS[tier]} · {effectiveDpr.toFixed(2)}×
        </output>
      </div>

      <fieldset className="graphics-settings__choices">
        <legend className="sr-only">Grafik kalitesini seçin</legend>
        <label className="graphics-settings__auto">
          <input
            type="radio"
            name="graphics-quality"
            value="auto"
            checked={preference === 'auto'}
            onChange={() => selectPreference('auto')}
          />
          <span><b>OTOMATİK</b><small>Donanımı ve oyun FPS'ini ölçerek kaliteyi yönetir.</small></span>
        </label>

        <div className="graphics-settings__grid">
          {GRAPHICS_OPTIONS.map((option) => (
            <label className="graphics-settings__option" data-tier={option.id} key={option.id}>
              <input
                type="radio"
                name="graphics-quality"
                value={option.id}
                checked={preference === option.id}
                onChange={() => selectPreference(option.id)}
              />
              <span>
                <strong>{option.label}</strong>
                <em>{option.detail}</em>
                <small>ÖNERİLEN · {option.recommendation}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p>İlk açılışta Otomatik profil kullanılır. Manuel seçiminiz tüm oyuna uygulanır, saklanır ve siz değiştirene kadar sabit kalır.</p>
    </section>
  )
}
