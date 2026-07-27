import { useEffect, useRef, useState } from 'react'
import { gameAudio } from '../audio/gameAudio'
import { useAudioStore } from '../audio/audioStore'
import { useSessionStore } from '../store/sessionStore'
import { CharacterGallery } from './CharacterGallery'
import { MenuBattleStage, type MenuStageAction } from './MenuBattleStage'

export function MainMenu() {
  const [showCharacters, setShowCharacters] = useState(false)
  const [stageReady, setStageReady] = useState(false)
  const [transition, setTransition] = useState<MenuStageAction>('idle')
  const transitionTimer = useRef<number | null>(null)
  const showControls = useSessionStore((state) => state.showControls)
  const openSettings = useAudioStore((state) => state.openPanel)
  const closeSettings = useAudioStore((state) => state.closePanel)
  useEffect(() => () => {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current)
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(() => setStageReady(true), 3_500)
    return () => window.clearTimeout(timer)
  }, [])
  if (showCharacters) return <CharacterGallery onClose={() => setShowCharacters(false)} />

  const begin = (next: Exclude<MenuStageAction, 'idle'>) => {
    if (transition !== 'idle') return
    closeSettings()
    setTransition(next)
    const cue = next === 'heroes' ? 'menu-hero-strike' : 'menu-enemy-strike'
    gameAudio.unlock()
    gameAudio.play(cue)
    useAudioStore.getState().noteEffect(cue)
    transitionTimer.current = window.setTimeout(() => {
      if (next === 'heroes') showControls()
      else setShowCharacters(true)
      setTransition('idle')
      transitionTimer.current = null
    }, 780)
  }
  return (
    <section className={`menu-screen menu-screen--battle is-${transition}`} aria-label="Ana menü">
      {stageReady ? <MenuBattleStage action={transition} /> : <div className="menu-battle-stage menu-battle-stage--placeholder" aria-hidden="true" />}
      <div className="menu-screen__core">
        <h1>MERBUT</h1>
        <div className="menu-screen__actions">
          <button className="menu-primary" type="button" disabled={transition !== 'idle'} onClick={() => begin('heroes')}>OYUNA BAŞLA</button>
          <button className="menu-secondary" type="button" disabled={transition !== 'idle'} onClick={() => begin('enemies')}>KARAKTERLER</button>
          <button className="menu-settings" type="button" disabled={transition !== 'idle'} onClick={openSettings}>AYARLAR</button>
        </div>
      </div>
      <div className="menu-screen__versus" aria-hidden="true"><i />VS<i /></div>
      <div className="menu-screen__slash" aria-hidden="true" />
    </section>
  )
}
