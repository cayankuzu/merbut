import { BIOMES } from '../config/biomes'
import { DIFFICULTIES } from '../config/difficulty'
import { achievementById } from '../meta/achievements'
import { useRunStore } from '../meta/runTracker'
import { HERO_NAMES } from '../sim/players'
import { useSessionStore } from '../store/sessionStore'

interface RunSummaryProps {
  compact?: boolean
}

function formatTime(totalSeconds: number) {
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(Math.floor(totalSeconds % 60)).padStart(2, '0')}`
}

export function RunSummary({ compact = false }: RunSummaryProps) {
  const players = useSessionStore((state) => state.players)
  const elapsed = useSessionStore((state) => state.elapsedSeconds)
  const difficulty = useSessionStore((state) => state.difficulty)
  const currentBiome = useSessionStore((state) => state.currentBiome)
  const result = useRunStore((state) => state.result)
  const falls = useRunStore((state) => state.falls)
  const unlocked = useRunStore((state) => state.unlockedThisRun)
  const totalScore = players.ali.score + players.jack.score

  return (
    <div className={`run-summary${compact ? ' run-summary--compact' : ''}`} aria-label="Oyun özeti">
      {result ? <div className={`run-summary__rank rank-${result.rank}`} aria-label={`Rütbe ${result.rank}`}><b>{result.rank}</b><small>{result.points} PUAN</small></div> : null}
      <div className="run-summary__totals">
        <div><span>TOPLAM SKOR</span><b>{totalScore.toLocaleString('tr-TR')}</b></div>
        <div><span>SÜRE</span><b>{formatTime(elapsed)}</b></div>
        <div><span>ZORLUK</span><b>{DIFFICULTIES[difficulty].label}</b></div>
        <div><span>İLERLEME</span><b>{Math.min(BIOMES.length, currentBiome + 1)}/{BIOMES.length}</b></div>
      </div>
      <div className="run-summary__heroes">
        {(['ali', 'jack'] as const).map((id) => (
          <article key={id}>
            <strong>{HERO_NAMES[id]}</strong>
            <span>{players[id].score.toLocaleString('tr-TR')} puan</span>
            <small>{players[id].kills} yenilgi · en uzun kombo {players[id].bestCombo}</small>
          </article>
        ))}
      </div>
      <footer>{falls} düşüş{unlocked.length > 0 ? ` · Açılan başarımlar: ${unlocked.map((id) => achievementById(id)?.title).join(', ')}` : ''}</footer>
    </div>
  )
}
