import { useEffect, useRef, useState } from 'react'
import { ASSET_PATHS } from '../../config/assetPaths'
import { BIOMES } from '../../config/biomes'
import { BIOME_CONTENT } from '../../content/biomeContent'
import { voiceBlip } from '../../audio/ambience'
import { dismissAchievementToast, useRunStore } from '../../meta/runTracker'
import { simClock } from '../../sim/clock'
import { gameEvents } from '../../sim/events'
import { useSessionStore } from '../../store/sessionStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useDialogueStore } from '../../story/dialogueStore'
import { SPEAKERS } from '../../story/script'

const trackNumber = (index: number) => String(index + 1).padStart(2, '0')

/**
 * Each realm opens like a track on the album: the cover slides in, the record
 * rolls out of its sleeve and the title, tagline and one-line lesson follow.
 */
export function BiomeTitleCard() {
  const biome = useSessionStore((state) => state.currentBiome)
  const until = useSessionStore((state) => state.biomeBannerUntil)
  const phase = useSessionStore((state) => state.phase)
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setTick((tick) => tick + 1), 200)
    return () => window.clearInterval(timer)
  }, [])
  const visible = until > simClock.now() && (phase === 'playing' || phase === 'countdown')
  if (!visible) return null
  const content = BIOME_CONTENT[biome]!
  const definition = BIOMES[biome]!
  return (
    <section className="title-card" key={biome} role="status" aria-live="polite" style={{ '--accent': definition.accentColor } as React.CSSProperties}>
      <div className="title-card__sleeve" aria-hidden="true">
        <span className="title-card__vinyl"><i style={{ backgroundImage: `url(${definition.art.cover})` }} /></span>
        <img src={definition.art.cover} alt="" />
      </div>
      <div className="title-card__text">
        <small>PARÇA {trackNumber(biome)} · {content.chapter}</small>
        <h1>{definition.title}</h1>
        <em>{content.tagline}</em>
        <p>{content.mechanicHint}</p>
      </div>
    </section>
  )
}

const PORTRAIT: Record<keyof typeof SPEAKERS, string> = {
  ali: ASSET_PATHS.ui.aliHud,
  jack: ASSET_PATHS.ui.jackHud,
  ...ASSET_PATHS.portraits,
}

/**
 * Subtitles with a typewriter and a voice blip. Timing uses real time but
 * holds while the game is paused.
 */
export function DialogueOverlay() {
  const current = useDialogueStore((state) => state.current)
  const next = useDialogueStore((state) => state.next)
  const speed = useSettingsStore((state) => state.dialogueSpeed)
  const [shown, setShown] = useState(0)
  const elapsed = useRef(0)
  const shownRef = useRef(0)

  useEffect(() => {
    elapsed.current = 0
    shownRef.current = 0
    setShown(0)
    if (!current) return
    const perSecond = { slow: 22, normal: 34, fast: 55, instant: 400 }[speed]
    let last = performance.now()
    let frame = 0
    const loop = (now: number) => {
      const paused = useSessionStore.getState().phase === 'paused'
      if (!paused) elapsed.current += now - last
      last = now
      const letters = Math.min(current.text.length, Math.floor(elapsed.current / 1_000 * perSecond))
      if (letters !== shownRef.current) {
        if (Math.floor(letters / 3) > Math.floor(shownRef.current / 3)) voiceBlip(SPEAKERS[current.speaker].pitch)
        shownRef.current = letters
        setShown(letters)
      }
      if (elapsed.current >= current.duration) {
        next()
        return
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [current, next, speed])

  if (!current) return null
  const speaker = SPEAKERS[current.speaker]
  const portrait = PORTRAIT[current.speaker]
  return (
    <div className={`dialogue dialogue--${current.speaker}${current.priority === 'scene' ? ' is-scene' : ''}`} role="log" aria-live="polite" style={{ '--speaker': speaker.color } as React.CSSProperties}>
      <div className="dialogue__portrait" aria-hidden="true">{portrait ? <img src={portrait} alt="" /> : <span>{speaker.name.slice(0, 1)}</span>}</div>
      <div className="dialogue__body">
        <strong>{speaker.name}</strong>
        <p>{current.text.slice(0, shown)}<span className="dialogue__rest">{current.text.slice(shown)}</span></p>
      </div>
    </div>
  )
}

/** One system toast at a time (gates, portal ambush, falls) plus achievements. */
export function Toasts() {
  const feed = useSessionStore((state) => state.feed)
  const portalAlert = useSessionStore((state) => state.portalAlert)
  const achievements = useRunStore((state) => state.toasts)
  const latest = feed.at(-1)
  useEffect(() => {
    if (achievements.length === 0) return
    const first = achievements[0]!
    const timer = window.setTimeout(() => dismissAchievementToast(first.id), 4_800)
    return () => window.clearTimeout(timer)
  }, [achievements])
  return (
    <>
      {portalAlert ? (
        <div className="portal-alert" role="alert"><small>AKU · ZAMAN KIRILMASI</small><strong>{portalAlert.title}</strong><span>{portalAlert.detail}</span></div>
      ) : latest ? (
        <div className={`system-toast is-${latest.tone}`} key={latest.id} role="status">{latest.text}</div>
      ) : null}
      {achievements[0] ? (
        <aside className="achievement-toast" key={achievements[0].id} role="status">
          <i aria-hidden="true">★</i>
          <div><small>BAŞARIM AÇILDI</small><strong>{achievements[0].title}</strong><span>{achievements[0].description}</span></div>
        </aside>
      ) : null}
    </>
  )
}

/** Red edge pulse when a hero is hit; stronger when they go down. */
export function DamageVignette() {
  const [pulse, setPulse] = useState<{ key: number; kind: 'hit' | 'heavy' | 'perfect' } | null>(null)
  const reduce = useSettingsStore((state) => state.reduceFlashes)
  useEffect(() => gameEvents.on((event) => {
    if (event.type === 'player-hit') setPulse({ key: performance.now(), kind: event.down ? 'heavy' : 'hit' })
    if (event.type === 'player-dash' && event.perfect) setPulse({ key: performance.now(), kind: 'perfect' })
  }), [])
  if (!pulse || reduce) return null
  return <div className={`damage-vignette is-${pulse.kind}`} key={pulse.key} aria-hidden="true" onAnimationEnd={() => setPulse(null)} />
}
