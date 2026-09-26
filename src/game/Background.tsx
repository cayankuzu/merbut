import { useEffect, useRef, type CSSProperties } from 'react'
import { BACKDROP_PANEL_COUNT, BIOMES, BIOME_WORLD_WIDTH, WORLD_VISUAL_LEFT } from '../config/biomes'
import { useGameStore } from '../store/gameStore'

/**
 * The painted world behind the 3D scene: one "album cover" per realm in two
 * parallax layers. The track scrolls with the camera; inside each realm the
 * back layer (sky, celestial body, far ridges) drifts along with the camera by
 * PARALLAX of the realm's width, so it reads as far away while the front layer
 * (mid silhouettes) moves with the ground.
 *
 * Realms crossfade through alpha baked into the paintings' edges (no CSS masks).
 * Both layers are painted so their ground line sits at ART_GROUND of the image
 * height; that line is pinned to the live horizon of the 3D floor, which the
 * BackdropHorizon component publishes as --horizon-y.
 */
const PARALLAX = 0.2
/** Design ground line (600 of the 780 px crop) as a fraction of the image height. */
const ART_GROUND = 600 / 780
/** Image height divided by realm width (both layers share it). */
const ART_ASPECT = 650 / 3200

const trackStyle = { '--panel-count': BACKDROP_PANEL_COUNT } as CSSProperties
const realmCenter = (index: number) => WORLD_VISUAL_LEFT + (index + 0.5) * BIOME_WORLD_WIDTH

export function Background() {
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const resize = () => {
      const realmWidth = root.clientWidth * 2
      root.style.setProperty('--art-height', `${(realmWidth * ART_ASPECT).toFixed(1)}px`)
      root.style.setProperty('--art-ground', String(ART_GROUND))
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let lastTransform = ''
    let lastRealm = -1
    const realms = () => trackRef.current?.querySelectorAll<HTMLElement>('.realm-backdrop') ?? []

    const updatePosition = (cameraX: number) => {
      const track = trackRef.current
      const root = rootRef.current
      if (!track || !root) return
      // The camera centre maps to the panel centre: panel i is centred at x = i * panel width.
      const panelProgress = (cameraX - (WORLD_VISUAL_LEFT + BIOME_WORLD_WIDTH / 4)) / (BIOME_WORLD_WIDTH / 2)
      const transform = `translate3d(${(-panelProgress * 100 / BACKDROP_PANEL_COUNT).toFixed(4)}%, 0, 0)`
      if (transform !== lastTransform) {
        track.style.transform = transform
        lastTransform = transform
      }
      const activeRealm = Math.max(0, Math.min(BIOMES.length - 1, Math.floor((cameraX - WORLD_VISUAL_LEFT) / BIOME_WORLD_WIDTH)))
      realms().forEach((element, index) => {
        // Only realms whose box (0.2 panel overlap each side) meets the screen are
        // laid out at all; a small margin lets the next one decode before it shows.
        const near = index * 2 + 2.2 > panelProgress - 0.3 && index * 2 - 0.2 < panelProgress + 1.3
        const display = near ? '' : 'none'
        if (element.style.display !== display) element.style.display = display
        if (!near) return
        const offset = (cameraX - realmCenter(index)) / BIOME_WORLD_WIDTH
        element.style.setProperty('--parallax', (offset * PARALLAX * 100).toFixed(3))
      })
      if (activeRealm !== lastRealm) {
        const biome = BIOMES[activeRealm]!
        root.dataset.biome = biome.id
        root.dataset.weather = biome.weather
        root.style.setProperty('--biome-accent', biome.accentColor)
        root.style.setProperty('--biome-haze', biome.fogColor)
        root.style.setProperty('--sky-top', biome.skyTop)
        root.style.setProperty('--floor', biome.floorColor)
        lastRealm = activeRealm
      }
    }

    updatePosition(useGameStore.getState().cameraX)
    return useGameStore.subscribe((state, previous) => {
      if (state.cameraX !== previous.cameraX) updatePosition(state.cameraX)
    })
  }, [])

  return (
    <div ref={rootRef} className="scene-backdrop" aria-hidden="true">
      <div ref={trackRef} className="scene-backdrop__track" data-panel-count={BACKDROP_PANEL_COUNT} style={trackStyle}>
        {BIOMES.map((biome, index) => (
          <div
            className={`realm-backdrop${index === 0 ? ' is-first' : ''}${index === BIOMES.length - 1 ? ' is-last' : ''}`}
            data-biome={biome.id}
            key={biome.id}
            style={{ '--realm-index': index } as CSSProperties}
          >
            <img className="realm-backdrop__back" src={biome.art.back} alt="" decoding="async" draggable={false} fetchPriority={index < 1 ? 'high' : 'low'} />
            <img className="realm-backdrop__front" src={biome.art.front} alt="" decoding="async" draggable={false} fetchPriority={index < 1 ? 'high' : 'low'} />
          </div>
        ))}
      </div>
      <div className="scene-backdrop__haze" />
    </div>
  )
}
