import { useEffect, useState } from 'react'
import { useAudioStore } from '../audio/audioStore'
import { biomeTitle } from '../config/biomes'
import { biomeText } from '../content/biomeContent'
import { useLocale, useStrings, type Strings } from '../i18n'
import { useSessionStore } from '../store/sessionStore'
import type { CharacterId } from '../types/character'
import type { PlayerAction } from '../types/controls'
import { ActionKeys } from './ui/KeyCap'

const ACTIONS: { action: PlayerAction; both?: PlayerAction; label: keyof Strings['flow'] & `action${string}` }[] = [
  { action: 'left', both: 'right', label: 'actionMove' },
  { action: 'jump', label: 'actionJump' },
  { action: 'attack', label: 'actionAttack' },
  { action: 'dash', label: 'actionDodge' },
  { action: 'ability', label: 'actionAbility' },
  { action: 'rotateLeft', both: 'rotateRight', label: 'actionTurn' },
]

function HeroControls({ id }: { id: CharacterId }) {
  const s = useStrings()
  return (
    <article>
      <h2>{s.common.heroName(id)}</h2>
      {ACTIONS.map((row) => <p key={row.action}><ActionKeys player={id} action={row.action} both={row.both} /><span>{s.flow[row.label]}</span></p>)}
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
  const locale = useLocale()
  const s = useStrings()
  const content = biomeText(biome, locale)

  // Inside a sub-panel, Esc / gamepad B mean "back", like the back button, not "resume".
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
    <section className="pause-screen" aria-label={s.flow.pauseAria} role="dialog" aria-modal="true">
      <small>{s.flow.pauseKicker(content.chapter)}</small>
      <h1>{panel === 'controls' ? s.flow.controlsTitle : s.flow.pauseTitle}</h1>
      {panel === 'controls' ? (
        <div className="pause-screen__controls"><HeroControls id="ali" /><HeroControls id="jack" /></div>
      ) : (
        <p className="pause-screen__objective"><strong>{biomeTitle(biome, locale)}</strong> · {content.mechanicHint}</p>
      )}
      <div className="pause-screen__actions">
        {panel !== 'menu' ? <button className="menu-primary" type="button" autoFocus onClick={() => setPanel('menu')}>{s.common.back}</button> : (
          <>
            <button className="menu-primary" type="button" autoFocus onClick={resume}>{s.flow.resume}</button>
            <button type="button" onClick={restart}>{s.flow.restart}</button>
            <button type="button" onClick={() => setPanel('controls')}>{s.flow.controls}</button>
            <button type="button" onClick={openSettings}>{s.flow.settings}</button>
            <button type="button" onClick={returnToMenu}>{s.flow.returnToMainMenu}</button>
          </>
        )}
      </div>
      <em>{panel === 'menu' ? s.flow.pauseHintResume : s.flow.pauseHintBack}</em>
    </section>
  )
}
