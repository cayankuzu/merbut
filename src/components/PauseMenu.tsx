import { useState } from 'react'
import { useAudioStore } from '../audio/audioStore'
import { useSessionStore } from '../store/sessionStore'

export function PauseMenu() {
  const [panel, setPanel] = useState<'menu' | 'controls'>('menu')
  const resume = useSessionStore((state) => state.resume)
  const restart = useSessionStore((state) => state.restart)
  const returnToMenu = useSessionStore((state) => state.returnToMenu)
  const openSettings = useAudioStore((state) => state.openPanel)

  return (
    <section className="pause-screen" aria-label="Oyun duraklatıldı">
      <small>MERBUT · DURAKLATILDI</small>
      <h1>{panel === 'controls' ? 'Kontroller' : 'Zaman dondu'}</h1>
      {panel === 'controls' ? (
        <div className="pause-screen__controls">
          <article><h2>Hz. Ali</h2><p>A / D · Hareket</p><p>W · Zıpla</p><p>S · Saldır</p><p>R · Alev topu</p><p>Z / X · Döndür</p></article>
          <article><h2>Samuray Jack</h2><p>← / → · Hareket</p><p>↑ · Zıpla</p><p>↓ · Saldır</p><p>L · Kalkan</p><p>Ö / Ç · Döndür</p></article>
        </div>
      ) : null}
      <div className="pause-screen__actions">
        {panel !== 'menu' ? <button className="menu-primary" type="button" onClick={() => setPanel('menu')}>GERİ</button> : (
          <>
            <button className="menu-primary" type="button" onClick={resume}>DEVAM ET</button>
            <button type="button" onClick={restart}>YENİDEN BAŞLA</button>
            <button type="button" onClick={returnToMenu}>ANA MENÜYE DÖN</button>
            <button type="button" onClick={() => setPanel('controls')}>KONTROLLER</button>
            <button type="button" onClick={openSettings}>AYARLAR</button>
          </>
        )}
      </div>
      <em>ESC · devam</em>
    </section>
  )
}
