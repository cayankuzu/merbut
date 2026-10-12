import { useEffect, useState } from 'react'
import { BIOMES, biomeTitle } from '../../config/biomes'
import { DIFFICULTY_ORDER, difficultyText } from '../../config/difficulty'
import { DEMO_LAST_BIOME, IS_DEMO, isPlayableBiome } from '../../config/edition'
import { APP_VERSION } from '../../config/version'
import { biomeText } from '../../content/biomeContent'
import { patchNotesFor } from '../../content/patchNotes'
import { creditsFor } from '../../content/credits'
import { useLocale, useStrings } from '../../i18n'
import { ACHIEVEMENTS, achievementText } from '../../meta/achievements'
import { useProgressStore } from '../../meta/progressStore'

function useBack(onBack: () => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Escape') return
      event.stopImmediatePropagation()
      onBack()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onBack])
}

function ScreenFrame({ eyebrow, title, onBack, children, className = '' }: { eyebrow: string; title: string; onBack: () => void; children: React.ReactNode; className?: string }) {
  useBack(onBack)
  const s = useStrings()
  return (
    <section className={`menu-page ${className}`} aria-label={title}>
      <header>
        <small>{eyebrow}</small>
        <h1>{title}</h1>
        <button type="button" onClick={onBack}>{s.menu.backArrow(s.common.back)}</button>
      </header>
      {children}
    </section>
  )
}

function formatTime(seconds?: number) {
  if (seconds === undefined) return '—'
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

/**
 * The chapter list is the album's tracklist: the focused track's cover sits
 * in the sleeve on the left and its record spins beside it.
 */
export function ChapterSelect({ onBack, onPick }: { onBack: () => void; onPick: (biome: number) => void }) {
  const s = useStrings()
  const locale = useLocale()
  const reached = useProgressStore((state) => state.furthestBiome)
  // The web demo opens only its own realms; the rest advertise the full game.
  const furthest = IS_DEMO ? Math.min(reached, DEMO_LAST_BIOME) : reached
  const [focused, setFocused] = useState(() => Math.min(furthest, BIOMES.length - 1))
  const lockedLabel = (index: number) => (isPlayableBiome(index) ? s.menu.locked : s.menu.lockedInDemo)
  const lockedHint = (index: number) => (isPlayableBiome(index) ? s.menu.lockedHint : s.menu.lockedInDemoHint)
  const shown = BIOMES[focused]!
  const shownText = biomeText(focused, locale)
  return (
    <ScreenFrame eyebrow={s.menu.chapterEyebrow} title={s.menu.tracklist} onBack={onBack} className="chapter-select">
      <div className="album" style={{ '--chapter-accent': shown.accentColor } as React.CSSProperties}>
        <div className="album__sleeve" aria-hidden="true">
          <div className="album__record">
            <span className="album__vinyl" key={shown.id}><i style={{ backgroundImage: `url(${shown.art.cover})` }} /></span>
            <img src={shown.art.cover} alt="" draggable={false} key={`cover-${shown.id}`} />
          </div>
          <div className="album__caption">
            <small>{s.menu.trackCaption(String(focused + 1).padStart(2, '0'), shownText.chapter)}</small>
            <strong>{focused > furthest ? (isPlayableBiome(focused) ? s.menu.lockedTrack : s.menu.lockedInDemo) : biomeTitle(focused, locale)}</strong>
            <em>{focused > furthest ? (isPlayableBiome(focused) ? s.menu.lockedTrackHint : s.menu.lockedInDemoHint) : shownText.mechanicHint}</em>
          </div>
        </div>
        <ol className="album__tracks">
          {BIOMES.map((biome, index) => {
            const locked = index > furthest
            const text = biomeText(index, locale)
            return (
              <li key={biome.id}>
                <button type="button" disabled={locked} autoFocus={index === Math.min(furthest, BIOMES.length - 1)} onClick={() => onPick(index)} onFocus={() => setFocused(index)} onMouseEnter={() => setFocused(index)} style={{ '--chapter-accent': biome.accentColor } as React.CSSProperties}>
                  <span className="album__number">{String(index + 1).padStart(2, '0')}</span>
                  <img src={biome.art.cover} alt="" draggable={false} />
                  <span className="album__title"><strong>{locked ? lockedLabel(index) : biomeTitle(index, locale)}</strong><em>{locked ? lockedHint(index) : text.tagline}</em></span>
                  <small>{text.chapter}</small>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
      <p className="menu-page__note">{s.menu.chapterNote}</p>
    </ScreenFrame>
  )
}

export function AchievementsScreen({ onBack }: { onBack: () => void }) {
  const s = useStrings()
  const locale = useLocale()
  const unlocked = useProgressStore((state) => state.achievements)
  const stats = useProgressStore((state) => state.stats)
  const bestTimes = useProgressStore((state) => state.bestTimes)
  const bestRanks = useProgressStore((state) => state.bestRanks)
  const count = ACHIEVEMENTS.filter((achievement) => unlocked[achievement.id]).length
  return (
    <ScreenFrame eyebrow={s.menu.unlockedCount(count, ACHIEVEMENTS.length)} title={s.menu.achievementsTitle} onBack={onBack} className="achievements-screen">
      <div className="achievement-grid">
        {ACHIEVEMENTS.map((achievement) => {
          const done = Boolean(unlocked[achievement.id])
          const hidden = achievement.secret && !done
          const text = achievementText(achievement.id, locale)
          return (
            <article key={achievement.id} className={done ? 'is-unlocked' : ''} tabIndex={0}>
              <i aria-hidden="true">{done ? '★' : '☆'}</i>
              <strong>{hidden ? '???' : text.title}</strong>
              <span>{hidden ? s.menu.hiddenAchievement : text.description}</span>
            </article>
          )
        })}
      </div>
      <div className="record-table">
        <table>
          <thead><tr><th>{s.menu.difficulty}</th><th>{s.menu.bestTime}</th><th>{s.menu.bestRank}</th></tr></thead>
          <tbody>{DIFFICULTY_ORDER.map((id) => <tr key={id}><td>{difficultyText(id, locale).label}</td><td>{formatTime(bestTimes[id])}</td><td>{bestRanks[id] ?? '—'}</td></tr>)}</tbody>
        </table>
        <dl>
          <div><dt>{s.menu.statRuns}</dt><dd>{stats.runs}</dd></div>
          <div><dt>{s.menu.statVictories}</dt><dd>{stats.victories}</dd></div>
          <div><dt>{s.menu.statKills}</dt><dd>{stats.kills.toLocaleString(s.menu.numberLocale)}</dd></div>
          <div><dt>{s.menu.statPerfectDodges}</dt><dd>{stats.perfectDodges}</dd></div>
          <div><dt>{s.menu.statBestCombo}</dt><dd>{stats.bestCombo}</dd></div>
          <div><dt>{s.menu.statPlayTime}</dt><dd>{formatTime(stats.playSeconds)}</dd></div>
        </dl>
      </div>
    </ScreenFrame>
  )
}

export function CreditsScreen({ onBack }: { onBack: () => void }) {
  const s = useStrings()
  const locale = useLocale()
  return (
    <ScreenFrame eyebrow={s.common.gameTitle} title={s.menu.creditsTitle} onBack={onBack} className="credits-screen">
      <div className="credits-roll">
        {creditsFor(locale).map((block) => (
          <section key={block.role}><small>{block.role}</small>{block.names.map((name) => <strong key={name}>{name}</strong>)}</section>
        ))}
        <p>{s.menu.disclaimer}</p>
      </div>
    </ScreenFrame>
  )
}

export function PatchNotes({ onBack }: { onBack: () => void }) {
  const s = useStrings()
  const locale = useLocale()
  return (
    <ScreenFrame eyebrow={s.menu.versionEyebrow(APP_VERSION)} title={s.menu.patchNotesTitle} onBack={onBack} className="patch-notes">
      <div className="patch-notes__list">
        {patchNotesFor(locale).map((release) => (
          <article key={release.version}>
            <header><strong>v{release.version}</strong><small>{release.title}</small></header>
            <ul>{release.notes.map((note) => <li key={note}>{note}</li>)}</ul>
          </article>
        ))}
      </div>
    </ScreenFrame>
  )
}
