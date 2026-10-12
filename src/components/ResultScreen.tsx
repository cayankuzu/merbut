import { useStrings } from '../i18n'
import { useSessionStore } from '../store/sessionStore'
import { useUiStore } from '../store/uiStore'
import { useProgressStore } from '../meta/progressStore'
import { RunSummary } from './RunSummary'

interface ResultScreenProps {
  victory: boolean
}

export function ResultScreen({ victory }: ResultScreenProps) {
  const restart = useSessionStore((state) => state.restart)
  const returnToMenu = useSessionStore((state) => state.returnToMenu)
  const setView = useUiStore((state) => state.setView)
  const checkpoint = useProgressStore((state) => state.checkpoint)
  const startAtBiome = useSessionStore((state) => state.startAtBiome)
  const s = useStrings()
  return (
    <section className={`result-screen ${victory ? 'is-victory' : 'is-defeat'}`} aria-label={victory ? s.flow.victoryAria : s.flow.defeatAria} role="dialog" aria-modal="true">
      <small>{victory ? s.flow.victoryKicker : s.flow.defeatKicker}</small>
      <h1>{victory ? s.flow.victoryTitle : s.flow.defeatTitle}</h1>
      {!victory ? <p className="result-screen__quote">{s.flow.defeatQuote}</p> : null}
      <RunSummary />
      <div className="menu-actions">
        <button type="button" onClick={() => { setView('main'); returnToMenu() }}>{s.flow.mainMenu}</button>
        {!victory && checkpoint && checkpoint.biome > 0 ? <button className="menu-primary" type="button" autoFocus onClick={() => startAtBiome(checkpoint.biome)}>{s.flow.continueFromCheckpoint}</button> : null}
        <button className={victory || !checkpoint || checkpoint.biome === 0 ? 'menu-primary' : undefined} type="button" autoFocus={victory || !checkpoint || checkpoint.biome === 0} onClick={restart}>{s.flow.playAgain}</button>
      </div>
    </section>
  )
}
