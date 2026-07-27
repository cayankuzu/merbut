import { BIOMES } from '../config/biomes'
import { DIFFICULTIES } from '../config/difficulty'
import { useSessionStore } from '../store/sessionStore'

interface RunSummaryProps {
  compact?: boolean
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function RunSummary({ compact = false }: RunSummaryProps) {
  const players = useSessionStore((state) => state.players)
  const elapsed = useSessionStore((state) => state.elapsedSeconds)
  const difficulty = useSessionStore((state) => state.difficulty)
  const currentBiome = useSessionStore((state) => state.currentBiome)
  const startingLives = DIFFICULTIES[difficulty].playerLives
  const totalScore = players.ali.score + players.jack.score
  const totalKills = players.ali.kills + players.jack.kills

  return (
    <div className={`run-summary${compact ? ' run-summary--compact' : ''}`} aria-label="Oyun özeti">
      <div className="run-summary__totals">
        <div><span>TOPLAM SKOR</span><b>{totalScore.toLocaleString('tr-TR')}</b></div>
        <div><span>SÜRE</span><b>{formatTime(elapsed)}</b></div>
        <div><span>ZORLUK</span><b>{DIFFICULTIES[difficulty].label}</b></div>
        <div><span>İLERLEME</span><b>{Math.min(BIOMES.length, currentBiome + 1)}/{BIOMES.length}</b></div>
      </div>
      <div className="run-summary__heroes">
        <article><strong>Hz. Ali</strong><span>{players.ali.score.toLocaleString('tr-TR')} puan</span><small>{players.ali.kills} öldürme · {startingLives - players.ali.lives} düşüş</small></article>
        <article><strong>Samuray Jack</strong><span>{players.jack.score.toLocaleString('tr-TR')} puan</span><small>{players.jack.kills} öldürme · {startingLives - players.jack.lives} düşüş</small></article>
      </div>
      <footer>{totalKills} TOPLAM ÖLDÜRME</footer>
    </div>
  )
}
