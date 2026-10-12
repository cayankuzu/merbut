import { BIOMES } from '../config/biomes'
import { difficultyText } from '../config/difficulty'
import { useLocale, useStrings } from '../i18n'
import { achievementText } from '../meta/achievements'
import { useRunStore } from '../meta/runTracker'
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
  const locale = useLocale()
  const s = useStrings()
  const unlockedTitles = unlocked.map((id) => achievementText(id, locale).title).join(', ')

  return (
    <div className={`run-summary${compact ? ' run-summary--compact' : ''}`} aria-label={s.flow.summaryAria}>
      {result ? <div className={`run-summary__rank rank-${result.rank}`} aria-label={s.flow.rankAria(result.rank)}><b>{result.rank}</b><small>{s.flow.rankPoints(result.points)}</small></div> : null}
      <div className="run-summary__totals">
        <div><span>{s.flow.totalScore}</span><b>{s.flow.formatScore(totalScore)}</b></div>
        <div><span>{s.flow.time}</span><b>{formatTime(elapsed)}</b></div>
        <div><span>{s.flow.difficulty}</span><b>{difficultyText(difficulty, locale).label}</b></div>
        <div><span>{s.flow.progress}</span><b>{Math.min(BIOMES.length, currentBiome + 1)}/{BIOMES.length}</b></div>
      </div>
      <div className="run-summary__heroes">
        {(['ali', 'jack'] as const).map((id) => (
          <article key={id}>
            <strong>{s.common.heroName(id)}</strong>
            <span>{s.flow.heroScore(s.flow.formatScore(players[id].score))}</span>
            <small>{s.flow.heroStats(players[id].kills, players[id].bestCombo)}</small>
          </article>
        ))}
      </div>
      <footer>{s.flow.falls(falls)}{unlocked.length > 0 ? s.flow.unlockedAchievements(unlockedTitles) : ''}</footer>
    </div>
  )
}
