import { useSessionStore } from '../store/sessionStore'
import { RunSummary } from './RunSummary'

interface ResultScreenProps {
  victory: boolean
}

export function ResultScreen({ victory }: ResultScreenProps) {
  const restart = useSessionStore((state) => state.restart)
  const returnToMenu = useSessionStore((state) => state.returnToMenu)
  return (
    <section className={`result-screen ${victory ? 'is-victory' : 'is-defeat'}`} aria-label={victory ? 'Zafer' : 'Yenilgi'}>
      <small>{victory ? 'ALEV TAHTI DÜŞTÜ' : 'İKİ KAHRAMAN DA DÜŞTÜ'}</small>
      <h1>{victory ? 'ZAFER' : 'YENİLGİ'}</h1>
      <RunSummary />
      <div className="menu-actions"><button type="button" onClick={returnToMenu}>ANA MENÜ</button><button className="menu-primary" type="button" onClick={restart}>TEKRAR OYNA</button></div>
    </section>
  )
}
