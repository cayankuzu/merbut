import { useEffect } from 'react'
import { FULL_GAME_URL } from '../config/edition'
import { useStrings } from '../i18n'
import { useSessionStore } from '../store/sessionStore'
import { useDialogueStore } from '../story/dialogueStore'
import { useUiStore } from '../store/uiStore'
import { RunSummary } from './RunSummary'

/** The web demo's last screen: the gate of realm II leads to the full game on itch.io. */
export function DemoEndScreen() {
  const s = useStrings()
  const restart = useSessionStore((state) => state.restart)
  const returnToMenu = useSessionStore((state) => state.returnToMenu)
  const setView = useUiStore((state) => state.setView)
  // A realm bark still on screen would sit on top of the call to action.
  useEffect(() => useDialogueStore.getState().clear(), [])
  return (
    <section className="result-screen is-victory is-demo-end" aria-label={s.flow.demoEndAria} role="dialog" aria-modal="true">
      <small>{s.flow.demoEndEyebrow}</small>
      <h1>{s.flow.demoEndTitle}</h1>
      <p className="result-screen__quote">{s.flow.demoEndBody}</p>
      <RunSummary />
      <div className="menu-actions">
        <a className="menu-primary demo-end__buy" href={FULL_GAME_URL} target="_blank" rel="noopener noreferrer" aria-label={s.flow.demoEndBuyLabel} autoFocus>{s.flow.demoEndBuy}</a>
        <button type="button" onClick={restart}>{s.flow.demoEndReplay}</button>
        <button type="button" onClick={() => { setView('main'); returnToMenu() }}>{s.flow.demoEndMenu}</button>
      </div>
    </section>
  )
}
