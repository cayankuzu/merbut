import { useEffect, useRef, type CSSProperties } from 'react'
import { BACKDROP_PANEL_COUNT, BACKDROP_PANELS, BIOMES } from '../config/biomes'
import { GAME_CONFIG } from '../config/gameConfig'
import { useGameStore } from '../store/gameStore'

const trackStyle = { '--panel-count': BACKDROP_PANEL_COUNT } as CSSProperties

export function Background() {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame = 0
    let lastTransform = ''
    let lastPanel = -1
    const [minimumX, maximumX] = GAME_CONFIG.camera.xBounds

    const updatePosition = () => {
      const track = trackRef.current
      if (track) {
        const cameraX = useGameStore.getState().cameraX
        const progress = Math.min(1, Math.max(0, (cameraX - minimumX) / (maximumX - minimumX)))
        const maximumTrackTravel = ((BACKDROP_PANEL_COUNT - 1) / BACKDROP_PANEL_COUNT) * 100
        const transform = `translate3d(${(-progress * maximumTrackTravel).toFixed(4)}%, 0, 0)`
        if (transform !== lastTransform) {
          track.style.transform = transform
          lastTransform = transform
        }
        const activePanel = Math.round(progress * (BACKDROP_PANEL_COUNT - 1))
        if (activePanel !== lastPanel) {
          track.querySelectorAll<HTMLElement>('.scene-backdrop__panel').forEach((panel, index) => {
            panel.style.visibility = Math.abs(index - activePanel) <= 1 ? 'visible' : 'hidden'
          })
          track.querySelectorAll<HTMLElement>('.scene-backdrop__transition').forEach((transition) => {
            const boundary = Number(transition.dataset.boundary ?? -10)
            transition.style.visibility = Math.abs(boundary - activePanel) <= 2 ? 'visible' : 'hidden'
          })
          lastPanel = activePanel
        }
      }
      frame = window.requestAnimationFrame(updatePosition)
    }

    frame = window.requestAnimationFrame(updatePosition)
    return () => window.cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="scene-backdrop" aria-hidden="true">
      <div
        ref={trackRef}
        className="scene-backdrop__track"
        data-panel-count={BACKDROP_PANEL_COUNT}
        style={trackStyle}
      >
        {BACKDROP_PANELS.map((panel, index) => {
          const firstPanel = index === 0
          const lastPanel = index === BACKDROP_PANEL_COUNT - 1
          const startsBiome = panel.repeatIndex === 0 && !firstPanel
          const endsBiome = panel.repeatIndex === 1 && !lastPanel
          const fadeClass = [
            startsBiome ? 'has-biome-fade-left' : 'has-repeat-fade-left',
            endsBiome ? 'has-biome-fade-right' : 'has-repeat-fade-right',
            firstPanel ? 'is-first-panel' : '',
            lastPanel ? 'is-last-panel' : '',
          ].filter(Boolean).join(' ')

          return (
          <div
            className={`scene-backdrop__panel ${fadeClass}`}
            data-biome={panel.id}
            key={panel.panelId}
            style={{ '--panel-color': panel.panelColor } as CSSProperties}
          >
            <img
              className="scene-backdrop__backfill"
              src={panel.image}
              alt=""
              decoding="async"
              draggable={false}
              loading="eager"
            />
            <img
              className="scene-backdrop__image"
              src={panel.image}
              alt=""
              decoding="async"
              draggable={false}
              fetchPriority={index < 2 ? 'high' : 'low'}
              loading="eager"
            />
          </div>
          )
        })}
        {BIOMES.slice(0, -1).map((biome, index) => {
          const next = BIOMES[index + 1]
          const boundaryPanel = (index + 1) * 2
          return (
            <div
              className="scene-backdrop__transition"
              data-boundary={boundaryPanel}
              key={`${biome.id}-${next.id}`}
              style={{
                '--boundary': boundaryPanel,
                '--from-color': biome.accentColor,
                '--to-color': next.accentColor,
              } as CSSProperties}
            />
          )
        })}
      </div>
      <div className="scene-backdrop__haze" />
    </div>
  )
}
