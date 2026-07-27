import { useSessionStore } from '../store/sessionStore'
import { RunSummary } from './RunSummary'

export function EndingOverlay() {
  const phase = useSessionStore((state) => state.phase)
  const bossPhase = useSessionStore((state) => state.bossPhase)
  const restart = useSessionStore((state) => state.restart)
  const returnToMenu = useSessionStore((state) => state.returnToMenu)
  if (phase !== 'ending') return null
  if (bossPhase === 'defeated') return <section className="ending-overlay ending-overlay--defeated" aria-live="assertive"><small>ZAMANIN EFENDİSİ DÜŞTÜ</small><h1>AKU YENİLDİ</h1></section>
  if (bossPhase === 'portal') return <section className="ending-overlay ending-overlay--portal" aria-live="assertive"><small>AMA SON BİR OYUNU VAR</small><h1>ZAMAN YARILIYOR</h1></section>
  if (bossPhase === 'falling') return <section className="ending-overlay ending-overlay--falling" aria-live="assertive"><small>KAHRAMANLAR ZAMANIN İÇİNE ÇEKİLİYOR</small></section>
  if (bossPhase !== 'continued') return null
  return (
    <section className="ending-overlay ending-overlay--continued" aria-label="Final">
      <small>MERBUT</small>
      <h1>DEVAM EDECEK...</h1>
      <p>Samuray Jack ve Hz. Ali, Aku’nun hareketli zaman portalında kayboldu.</p>
      <RunSummary compact />
      <div className="menu-actions"><button type="button" onClick={returnToMenu}>ANA MENÜ</button><button className="menu-primary" type="button" onClick={restart}>TEKRAR OYNA</button></div>
    </section>
  )
}
