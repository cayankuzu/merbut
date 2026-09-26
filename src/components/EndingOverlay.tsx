import { useState } from 'react'
import { ASSET_PATHS } from '../config/assetPaths'
import { useSessionStore } from '../store/sessionStore'
import { useUiStore } from '../store/uiStore'
import { CREDITS } from '../content/credits'
import { RunSummary } from './RunSummary'

/** Aku falls, the portal opens, both heroes fall, and the sequel is teased. */
export function EndingOverlay() {
  const phase = useSessionStore((state) => state.phase)
  const bossPhase = useSessionStore((state) => state.bossPhase)
  const restart = useSessionStore((state) => state.restart)
  const returnToMenu = useSessionStore((state) => state.returnToMenu)
  const setView = useUiStore((state) => state.setView)
  const [credits, setCredits] = useState(false)
  if (phase !== 'ending') return null
  if (bossPhase === 'defeated') return <section className="ending-overlay ending-overlay--defeated" aria-live="assertive"><small>ZAMANIN EFENDİSİ DÜŞTÜ</small><h1>AKU YENİLDİ</h1></section>
  if (bossPhase === 'portal') return <section className="ending-overlay ending-overlay--portal" aria-live="assertive"><small>AMA SON BİR OYUNU VAR</small><h1>ZAMAN YARILIYOR</h1></section>
  if (bossPhase === 'falling') return <section className="ending-overlay ending-overlay--falling" aria-live="assertive"><small>KAHRAMANLAR ZAMANIN İÇİNE ÇEKİLİYOR</small></section>
  if (bossPhase !== 'continued') return null
  if (credits) {
    return (
      <section className="ending-overlay ending-overlay--credits" aria-label="Yapımcılar">
        <div className="credits-scroll" onAnimationEnd={() => setCredits(false)}>
          <h1>MERBUT</h1>
          {CREDITS.map((block) => <section key={block.role}><small>{block.role}</small>{block.names.map((name) => <strong key={name}>{name}</strong>)}</section>)}
          <p>Bu yapım hayal ürünüdür. Tarihî ve dinî şahsiyetlere saygıyla yaklaşılmıştır.</p>
          <h2>MERBUT II · HZ. ALİ’NİN ZAMANI</h2>
        </div>
        <button className="ending-overlay__skip" type="button" autoFocus onClick={() => setCredits(false)}>GEÇ</button>
      </section>
    )
  }
  return (
    <section className="ending-overlay ending-overlay--continued" aria-label="Final" role="dialog" aria-modal="true">
      <div className="ending-overlay__art" style={{ backgroundImage: `url(${ASSET_PATHS.story.medina})` }} aria-hidden="true" />
      <small>SIRADAKİ DURAK</small>
      <h1>HZ. ALİ’NİN ZAMANI</h1>
      <p>Aku yenildi, ama portalı iki kahramanı çok eski bir çağa savurdu. <b>MERBUT II · DEVAM EDECEK...</b></p>
      <RunSummary compact />
      <div className="menu-actions">
        <button type="button" onClick={() => setCredits(true)}>YAPIMCILAR</button>
        <button type="button" onClick={() => { setView('main'); returnToMenu() }}>ANA MENÜ</button>
        <button className="menu-primary" type="button" autoFocus onClick={restart}>TEKRAR OYNA</button>
      </div>
    </section>
  )
}
