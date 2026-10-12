import { bossTitle } from '../config/enemies'
import { useLocale, useStrings, type Locale, type Strings } from '../i18n'
import { useSessionStore } from '../store/sessionStore'
import type { BossPhase } from '../types/session'

type CinematicCopy = { eyebrow: string; title: string; body?: string }

function cinematicCopy(bossPhase: BossPhase, { hud }: Strings, locale: Locale): CinematicCopy {
  switch (bossPhase) {
    case 'offering': return { eyebrow: hud.cinemaOfferingEyebrow, title: hud.cinemaOfferingTitle, body: hud.cinemaOfferingBody }
    case 'drinking': return { eyebrow: hud.cinemaDrinkingEyebrow, title: hud.cinemaDrinkingTitle }
    case 'arrival': return { eyebrow: hud.cinemaArrivalEyebrow, title: hud.cinemaArrivalTitle, body: hud.cinemaArrivalBody }
    case 'prayer': return { eyebrow: hud.cinemaPrayerEyebrow, title: hud.cinemaPrayerTitle, body: hud.cinemaPrayerBody }
    case 'aku-arrival': return { eyebrow: hud.cinemaAkuEyebrow, title: bossTitle('final', locale), body: hud.cinemaAkuBody }
    case 'countdown': return { eyebrow: hud.cinemaCountdownEyebrow, title: hud.cinemaCountdownTitle }
    default: return { eyebrow: '', title: '' }
  }
}

export function BossCinematicOverlay() {
  const phase = useSessionStore((state) => state.phase)
  const bossPhase = useSessionStore((state) => state.bossPhase)
  const bossCountdown = useSessionStore((state) => state.bossCountdown)
  const s = useStrings()
  const locale = useLocale()
  if (phase !== 'boss-intro' && phase !== 'final-intro') return null
  const { eyebrow, title, body } = cinematicCopy(bossPhase, s, locale)
  return (
    <section className={`boss-cinematic boss-cinematic--${bossPhase}`} aria-live="assertive">
      <div>
        <small>{eyebrow}</small>
        <h1>{bossPhase === 'countdown' ? bossCountdown : title}</h1>
        {body ? <p>{body}</p> : null}
      </div>
    </section>
  )
}
