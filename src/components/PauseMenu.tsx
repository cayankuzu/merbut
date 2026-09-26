import { useEffect, useState } from 'react'
import { useAudioStore } from '../audio/audioStore'
import { BIOMES } from '../config/biomes'
import { BIOME_CONTENT } from '../content/biomeContent'
import { useSessionStore } from '../store/sessionStore'
import type { CharacterId } from '../types/character'
import type { PlayerAction } from '../types/controls'
import { ActionKeys } from './ui/KeyCap'

const ACTIONS: { action: PlayerAction; both?: PlayerAction; label: string }[] = [
  { action: 'left', both: 'right', label: 'Hareket' },
  { action: 'jump', label: 'Zıpla' },
  { action: 'attack', label: 'Saldır' },
  { action: 'dash', label: 'Kaçın' },
  { action: 'ability', label: 'Özel yetenek' },
  { action: 'rotateLeft', both: 'rotateRight', label: 'Dön' },
]

function HeroControls({ id }: { id: CharacterId }) {
  return (
    <article>
      <h2>{id === 'ali' ? 'Hz. Ali' : 'Samuray Jack'}</h2>
      {ACTIONS.map((row) => <p key={row.action}><ActionKeys player={id} action={row.action} both={row.both} /><span>{row.label}</span></p>)}
    </article>
  )
}

export function PauseMenu() {
  const [panel, setPanel] = useState<'menu' | 'controls'>('menu')
  const resume = useSessionStore((state) => state.resume)
  const restart = useSessionStore((state) => state.restart)
  const returnToMenu = useSessionStore((state) => state.returnToMenu)
  const biome = useSessionStore((state) => state.currentBiome)
  const openSettings = useAudioStore((state) => state.openPanel)
  const content = BIOME_CONTENT[biome]!

  // Inside a sub-panel, Esc / gamepad B mean "back", like the GERİ button, not "resume".
  useEffect(() => {
    if (panel === 'menu') return
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Escape' || useAudioStore.getState().panelOpen) return
      event.stopImmediatePropagation()
      setPanel('menu')
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [panel])

  return (
    <section className="pause-screen" aria-label="Oyun duraklatıldı" role="dialog" aria-modal="true">
      <small>MERBUT · DURAKLATILDI · {content.chapter}</small>
      <h1>{panel === 'controls' ? 'Kontroller' : 'Zaman dondu'}</h1>
      {panel === 'controls' ? (
        <div className="pause-screen__controls"><HeroControls id="ali" /><HeroControls id="jack" /></div>
      ) : (
        <p className="pause-screen__objective"><strong>{BIOMES[biome]!.title}</strong> · {content.mechanicHint}</p>
      )}
      <div className="pause-screen__actions">
        {panel !== 'menu' ? <button className="menu-primary" type="button" autoFocus onClick={() => setPanel('menu')}>GERİ</button> : (
          <>
            <button className="menu-primary" type="button" autoFocus onClick={resume}>DEVAM ET</button>
            <button type="button" onClick={restart}>YENİDEN BAŞLA</button>
            <button type="button" onClick={() => setPanel('controls')}>KONTROLLER</button>
            <button type="button" onClick={openSettings}>AYARLAR</button>
            <button type="button" onClick={returnToMenu}>ANA MENÜYE DÖN</button>
          </>
        )}
      </div>
      <em>{panel === 'menu' ? 'Esc · Start · devam' : 'Esc · B · geri'}</em>
    </section>
  )
}
