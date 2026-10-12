import { startTransition } from 'react'
import { useStrings, type Strings } from '../i18n'
import {
  type GraphicsPreference,
  type PerformanceTier,
  runtimeRenderDpr,
  usePerformanceStore,
} from '../store/performanceStore'
import { useSessionStore } from '../store/sessionStore'

type SettingsStrings = Strings['settings']

interface GraphicsOption {
  detail: string
  id: PerformanceTier
  label: string
  recommendation: string
}

const GRAPHICS_TIERS: readonly PerformanceTier[] = ['minimal', 'performance', 'balanced', 'high']

function graphicsOption(id: PerformanceTier, s: SettingsStrings): GraphicsOption {
  switch (id) {
    case 'minimal': return { id, label: s.tierMinimal, detail: s.tierMinimalDetail, recommendation: s.tierMinimalSpec }
    case 'performance': return { id, label: s.tierPerformance, detail: s.tierPerformanceDetail, recommendation: s.tierPerformanceSpec }
    case 'balanced': return { id, label: s.tierBalanced, detail: s.tierBalancedDetail, recommendation: s.tierBalancedSpec }
    case 'high': return { id, label: s.tierHigh, detail: s.tierHighDetail, recommendation: s.tierHighSpec }
  }
}

export function GraphicsSettingsPanel() {
  const s = useStrings().settings
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
          <small>{s.graphicsEyebrow}</small>
          <h3 id="graphics-settings-title">{s.graphicsTitle}</h3>
        </div>
        <output title={s.graphicsFrameTime(p95FrameMs.toFixed(1))}>
          {Math.round(fps)} FPS · {graphicsOption(tier, s).label} · {effectiveDpr.toFixed(2)}×
        </output>
      </div>

      <fieldset className="graphics-settings__choices">
        <legend className="sr-only">{s.graphicsLegend}</legend>
        <label className="graphics-settings__auto">
          <input
            type="radio"
            name="graphics-quality"
            value="auto"
            checked={preference === 'auto'}
            onChange={() => selectPreference('auto')}
          />
          <span><b>{s.graphicsAuto}</b><small>{s.graphicsAutoDetail}</small></span>
        </label>

        <div className="graphics-settings__grid">
          {GRAPHICS_TIERS.map((id) => graphicsOption(id, s)).map((option) => (
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
                <small>{s.graphicsRecommended(option.recommendation)}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p>{s.graphicsNote}</p>
    </section>
  )
}
