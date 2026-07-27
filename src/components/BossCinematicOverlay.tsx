import { useSessionStore } from '../store/sessionStore'

const COPY = {
  offering: ['KADİM SUNU', 'Mor Zemzem'],
  drinking: ['KUDRET UYANIYOR', 'Can sınırları genişliyor'],
  arrival: ['AKU’NUN GÖLGESİ', 'Karanlık Samuray'],
  prayer: ['SAMURAYIN DUASI', 'İlahi kudret uyanıyor'],
  'aku-arrival': ['FINAL BOSS', 'Aku, Zamanın Efendisi'],
  countdown: ['BOSS SAVAŞI', 'Hazır ol'],
  none: ['', ''], fight: ['', ''], complete: ['', ''], defeated: ['', ''], portal: ['', ''], falling: ['', ''], continued: ['', ''],
} as const

export function BossCinematicOverlay() {
  const phase = useSessionStore((state) => state.phase)
  const bossPhase = useSessionStore((state) => state.bossPhase)
  const bossCountdown = useSessionStore((state) => state.bossCountdown)
  if (phase !== 'boss-intro' && phase !== 'final-intro') return null
  const [eyebrow, title] = COPY[bossPhase]
  return (
    <section className={`boss-cinematic boss-cinematic--${bossPhase}`} aria-live="assertive">
      <div>
        <small>{eyebrow}</small>
        <h1>{bossPhase === 'countdown' ? bossCountdown : title}</h1>
        {bossPhase === 'offering' ? <p>İki kahraman, Gölge savaşından önce Zemzem kudretini paylaşır.</p> : null}
        {bossPhase === 'arrival' ? <p>Siyah alev işaretlerinden uzak dur. Dikenli çembere yaklaşma.</p> : null}
        {bossPhase === 'prayer' ? <p>Samuray Jack’in duası iki kahramana melek halkası veriyor: vurdukça ve zamanla can yenilenir.</p> : null}
        {bossPhase === 'aku-arrival' ? <p>Aku canını yeniler, biçim değiştirir ve her karşılaşmada farklı saldırır.</p> : null}
      </div>
    </section>
  )
}
