import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import { CHARACTER_ROSTER } from '../config/characterRoster'
import type { RosterPreview } from '../config/characterRoster'
import { DIFFICULTIES, type Difficulty } from '../config/difficulty'
import { useSessionStore } from '../store/sessionStore'
import { RosterCharacterPreview3D } from './RosterCharacterPreview3D'

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'normal', 'hard', 'soulslike']
type PreviewPan = readonly [number, number]
type GalleryDrag = {
  mode: 'rotate' | 'pan'
  pan: PreviewPan
  pointerId: number
  rotation: number
  x: number
  y: number
}

function galleryFrontRotation(preview: RosterPreview) {
  return preview.type === 'hero' ? -Math.PI / 2 : 0
}

const clampPan = (value: number) => Math.max(-2.8, Math.min(2.8, value))

export function CharacterGallery({ onClose }: { onClose: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [rotation, setRotation] = useState(() => galleryFrontRotation(CHARACTER_ROSTER[0]!.preview))
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<PreviewPan>([0, 0])
  const drag = useRef<GalleryDrag | null>(null)
  const strip = useRef<HTMLElement>(null)
  const active = CHARACTER_ROSTER[activeIndex]!
  const difficulty = useSessionStore((state) => state.difficulty)
  const setDifficulty = useSessionStore((state) => state.setDifficulty)
  const rules = DIFFICULTIES[difficulty]
  const isHero = active.preview.type === 'hero'
  const isBoss = active.preview.type === 'shadow' || active.preview.type === 'aku'
  const displayHealth = isHero ? rules.playerHealth : isBoss ? Math.round(active.health * rules.bossHealth) : active.health
  const power = isHero ? `×${rules.playerDamage.toFixed(2)}` : isBoss ? `×${rules.bossDamage.toFixed(2)}` : 'SABİT'

  useEffect(() => {
    strip.current?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeIndex])

  const select = (index: number) => {
    const nextIndex = (index + CHARACTER_ROSTER.length) % CHARACTER_ROSTER.length
    setActiveIndex(nextIndex)
    setRotation(galleryFrontRotation(CHARACTER_ROSTER[nextIndex]!.preview))
    setZoom(1)
    setPan([0, 0])
  }
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.button !== 2) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      mode: event.button === 2 ? 'pan' : 'rotate',
      pan,
      pointerId: event.pointerId,
      rotation,
      x: event.clientX,
      y: event.clientY,
    }
  }
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return
    if (drag.current.mode === 'rotate') {
      setRotation(drag.current.rotation + (event.clientX - drag.current.x) * 0.012)
      return
    }
    setPan([
      clampPan(drag.current.pan[0] - (event.clientX - drag.current.x) * 0.006),
      clampPan(drag.current.pan[1] + (event.clientY - drag.current.y) * 0.006),
    ])
  }
  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null
  }
  const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    setZoom((value) => Math.max(0.58, Math.min(1.7, value - event.deltaY * 0.0012)))
  }

  return (
    <section className="character-gallery" aria-label="Karakterler">
      <header><div><small>MERBUT ARŞİVİ · {activeIndex + 1}/{CHARACTER_ROSTER.length}</small><h1>Karakterler</h1></div><button type="button" onClick={onClose} aria-label="Karakter arşivini kapat">KAPAT ×</button></header>
      <div className="character-gallery__stage" style={{ '--roster-accent': active.accent } as CSSProperties}>
        <button className="gallery-arrow gallery-arrow--left" type="button" onClick={() => select(activeIndex - 1)} aria-label="Önceki karakter">‹</button>
        <div
          className="character-gallery__model"
          data-pan-x={pan[0].toFixed(2)}
          data-pan-y={pan[1].toFixed(2)}
          role="group"
          tabIndex={0}
          aria-label={`${active.name} 3B modeli. Sol tuşla döndürün, sağ tuşla kadrajı taşıyın ve tekerlekle yakınlaştırın.`}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') setRotation((value) => value - 0.25)
            if (event.key === 'ArrowRight') setRotation((value) => value + 0.25)
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={onWheel}
          onContextMenu={(event) => event.preventDefault()}
        >
          <RosterCharacterPreview3D key={active.id} preview={active.preview} rotation={rotation} pan={pan} zoom={zoom} label={active.name} />
          <span>SOL SÜRÜKLE: 360° · SAĞ SÜRÜKLE: PAN · TEKERLEK: ZOOM · %{Math.round(zoom * 100)}</span>
        </div>
        <article className="character-gallery__copy">
          <small>{active.role}</small><h2>{active.name}</h2>
          <dl><div><dt>CAN · {rules.label.toUpperCase()}</dt><dd>{displayHealth}</dd></div><div><dt>SALDIRI · {power}</dt><dd>{active.attackType}</dd></div><div><dt>MENZİL</dt><dd>{active.range}</dd></div><div><dt>HAREKET</dt><dd>{active.mobility}</dd></div></dl>
          <h3>ÖZELLİKLER</h3><ul>{active.traits.map((trait) => <li key={trait}>{trait}</li>)}</ul>
        </article>
        <button className="gallery-arrow gallery-arrow--right" type="button" onClick={() => select(activeIndex + 1)} aria-label="Sonraki karakter">›</button>
      </div>
      <footer className="character-gallery__footer">
        <fieldset className="difficulty-select difficulty-select--gallery"><legend>ZORLUK · CAN VE BOSS GÜCÜ CANLI GÜNCELLENİR</legend>{DIFFICULTY_ORDER.map((id) => <button className={difficulty === id ? 'is-selected' : ''} type="button" onClick={() => setDifficulty(id)} aria-pressed={difficulty === id} key={id}><b>{DIFFICULTIES[id].label}</b><span>DALGA +{DIFFICULTIES[id].extraEnemies} · {DIFFICULTIES[id].playerLives} YAŞAM</span></button>)}</fieldset>
        <nav className="character-gallery__strip" ref={strip} aria-label="Tüm karakterler">
          {CHARACTER_ROSTER.map((entry, index) => <button type="button" aria-current={index === activeIndex} onClick={() => select(index)} key={entry.id}><i style={{ background: entry.accent }} /><span>{entry.name}</span><small>{entry.preview.type === 'hero' ? 'KAHRAMAN' : entry.preview.type === 'enemy' ? 'YARATIK' : 'BOSS'}</small></button>)}
        </nav>
      </footer>
    </section>
  )
}
