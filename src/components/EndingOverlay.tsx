import { useState } from 'react'
import { ASSET_PATHS } from '../config/assetPaths'
import { useSessionStore } from '../store/sessionStore'
import { useUiStore } from '../store/uiStore'
import { creditsFor } from '../content/credits'
import { useLocale, useStrings } from '../i18n'
import { RunSummary } from './RunSummary'

/** Aku falls, the portal opens, both heroes fall, and the sequel is teased. */
export function EndingOverlay() {
  const phase = useSessionStore((state) => state.phase)
  const bossPhase = useSessionStore((state) => state.bossPhase)
  const restart = useSessionStore((state) => state.restart)
  const returnToMenu = useSessionStore((state) => state.returnToMenu)
  const setView = useUiStore((state) => state.setView)
  const [credits, setCredits] = useState(false)
  const locale = useLocale()
  const s = useStrings()
  if (phase !== 'ending') return null
  if (bossPhase === 'defeated') return <section className="ending-overlay ending-overlay--defeated" aria-live="assertive"><small>{s.flow.defeatedKicker}</small><h1>{s.flow.defeatedTitle}</h1></section>
  if (bossPhase === 'portal') return <section className="ending-overlay ending-overlay--portal" aria-live="assertive"><small>{s.flow.portalKicker}</small><h1>{s.flow.portalTitle}</h1></section>
  if (bossPhase === 'falling') return <section className="ending-overlay ending-overlay--falling" aria-live="assertive"><small>{s.flow.fallingKicker}</small></section>
  if (bossPhase !== 'continued') return null
  if (credits) {
    return (
      <section className="ending-overlay ending-overlay--credits" aria-label={s.flow.creditsAria}>
        <div className="credits-scroll" onAnimationEnd={(event) => { if (event.target === event.currentTarget) setCredits(false) }}>
          <h1>{s.common.gameTitle}</h1>
          {creditsFor(locale).map((block) => <section key={block.role}><small>{block.role}</small>{block.names.map((name) => <strong key={name}>{name}</strong>)}</section>)}
          <p>{s.flow.creditsDisclaimer}</p>
          <h2>{s.flow.creditsSequel}</h2>
        </div>
        <button className="ending-overlay__skip" type="button" autoFocus onClick={() => setCredits(false)}>{s.flow.skip}</button>
      </section>
    )
  }
  return (
    <section className="ending-overlay ending-overlay--continued" aria-label={s.flow.finaleAria} role="dialog" aria-modal="true">
      <div className="ending-overlay__art" style={{ backgroundImage: `url(${ASSET_PATHS.story.medina})` }} aria-hidden="true" />
      <small>{s.flow.nextStop}</small>
      <h1>{s.flow.sequelHeadline}</h1>
      <p>{s.flow.endingStory} <b>{s.flow.toBeContinued}</b></p>
      <RunSummary compact />
      <div className="menu-actions">
        <button type="button" onClick={() => setCredits(true)}>{s.flow.credits}</button>
        <button type="button" onClick={() => { setView('main'); returnToMenu() }}>{s.flow.mainMenu}</button>
        <button className="menu-primary" type="button" autoFocus onClick={restart}>{s.flow.playAgain}</button>
      </div>
    </section>
  )
}
