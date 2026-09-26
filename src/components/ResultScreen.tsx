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
  return (
    <section className={`result-screen ${victory ? 'is-victory' : 'is-defeat'}`} aria-label={victory ? 'Zafer' : 'Yenilgi'} role="dialog" aria-modal="true">
      <small>{victory ? 'ALEV TAHTI DÜŞTÜ' : 'İKİ KAHRAMAN DA DÜŞTÜ'}</small>
      <h1>{victory ? 'ZAFER' : 'YENİLGİ'}</h1>
      {!victory ? <p className="result-screen__quote">“Düşmek ayıp değil; kalkmamak ayıptır.” Son kayıt noktasından devam edebilirsin.</p> : null}
      <RunSummary />
      <div className="menu-actions">
        <button type="button" onClick={() => { setView('main'); returnToMenu() }}>ANA MENÜ</button>
        {!victory && checkpoint && checkpoint.biome > 0 ? <button className="menu-primary" type="button" autoFocus onClick={() => startAtBiome(checkpoint.biome)}>KAYITTAN DEVAM ET</button> : null}
        <button className={victory || !checkpoint || checkpoint.biome === 0 ? 'menu-primary' : undefined} type="button" autoFocus={victory || !checkpoint || checkpoint.biome === 0} onClick={restart}>TEKRAR OYNA</button>
      </div>
    </section>
  )
}
