import { useEffect, useState } from 'react'
import { BIOMES } from '../../config/biomes'
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../../config/difficulty'
import { APP_VERSION } from '../../config/version'
import { BIOME_CONTENT } from '../../content/biomeContent'
import { PATCH_NOTES } from '../../content/patchNotes'
import { CREDITS } from '../../content/credits'
import { ACHIEVEMENTS } from '../../meta/achievements'
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
  return (
    <section className={`menu-page ${className}`} aria-label={title}>
      <header>
        <small>{eyebrow}</small>
        <h1>{title}</h1>
        <button type="button" onClick={onBack}>← GERİ</button>
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
  const furthest = useProgressStore((state) => state.furthestBiome)
  const [focused, setFocused] = useState(() => Math.min(furthest, BIOMES.length - 1))
  const shown = BIOMES[focused]!
  const shownContent = BIOME_CONTENT[focused]!
  return (
    <ScreenFrame eyebrow="ON DİYAR · TEK KADER" title="Parça listesi" onBack={onBack} className="chapter-select">
      <div className="album" style={{ '--chapter-accent': shown.accentColor } as React.CSSProperties}>
        <div className="album__sleeve" aria-hidden="true">
          <div className="album__record">
            <span className="album__vinyl" key={shown.id}><i style={{ backgroundImage: `url(${shown.art.cover})` }} /></span>
            <img src={shown.art.cover} alt="" draggable={false} key={`cover-${shown.id}`} />
          </div>
          <div className="album__caption">
            <small>PARÇA {String(focused + 1).padStart(2, '0')} · {shownContent.chapter}</small>
            <strong>{focused > furthest ? 'Kilitli parça' : shown.title}</strong>
            <em>{focused > furthest ? 'Önceki diyarı geçince açılır' : shownContent.mechanicHint}</em>
          </div>
        </div>
        <ol className="album__tracks">
          {BIOMES.map((biome, index) => {
            const locked = index > furthest
            const content = BIOME_CONTENT[index]!
            return (
              <li key={biome.id}>
                <button type="button" disabled={locked} autoFocus={index === Math.min(furthest, BIOMES.length - 1)} onClick={() => onPick(index)} onFocus={() => setFocused(index)} onMouseEnter={() => setFocused(index)} style={{ '--chapter-accent': biome.accentColor } as React.CSSProperties}>
                  <span className="album__number">{String(index + 1).padStart(2, '0')}</span>
                  <img src={biome.art.cover} alt="" draggable={false} />
                  <span className="album__title"><strong>{locked ? 'Kilitli' : biome.title}</strong><em>{locked ? 'Önceki diyarı geç' : content.tagline}</em></span>
                  <small>{content.chapter}</small>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
      <p className="menu-page__note">Bölüm seçimi rekor tablosuna sayılmaz; en iyi süre ve rütbe yalnız baştan oynanan koşularda kaydedilir.</p>
    </ScreenFrame>
  )
}

export function AchievementsScreen({ onBack }: { onBack: () => void }) {
  const unlocked = useProgressStore((state) => state.achievements)
  const stats = useProgressStore((state) => state.stats)
  const bestTimes = useProgressStore((state) => state.bestTimes)
  const bestRanks = useProgressStore((state) => state.bestRanks)
  const count = ACHIEVEMENTS.filter((achievement) => unlocked[achievement.id]).length
  return (
    <ScreenFrame eyebrow={`${count} / ${ACHIEVEMENTS.length} AÇILDI`} title="Başarımlar" onBack={onBack} className="achievements-screen">
      <div className="achievement-grid">
        {ACHIEVEMENTS.map((achievement) => {
          const done = Boolean(unlocked[achievement.id])
          const hidden = achievement.secret && !done
          return (
            <article key={achievement.id} className={done ? 'is-unlocked' : ''} tabIndex={0}>
              <i aria-hidden="true">{done ? '★' : '☆'}</i>
              <strong>{hidden ? '???' : achievement.title}</strong>
              <span>{hidden ? 'Gizli başarım.' : achievement.description}</span>
            </article>
          )
        })}
      </div>
      <div className="record-table">
        <table>
          <thead><tr><th>Zorluk</th><th>En iyi süre</th><th>En iyi rütbe</th></tr></thead>
          <tbody>{DIFFICULTY_ORDER.map((id) => <tr key={id}><td>{DIFFICULTIES[id].label}</td><td>{formatTime(bestTimes[id])}</td><td>{bestRanks[id] ?? '—'}</td></tr>)}</tbody>
        </table>
        <dl>
          <div><dt>Koşu</dt><dd>{stats.runs}</dd></div>
          <div><dt>Zafer</dt><dd>{stats.victories}</dd></div>
          <div><dt>Yenilen düşman</dt><dd>{stats.kills.toLocaleString('tr-TR')}</dd></div>
          <div><dt>Kusursuz kaçış</dt><dd>{stats.perfectDodges}</dd></div>
          <div><dt>En uzun kombo</dt><dd>{stats.bestCombo}</dd></div>
          <div><dt>Toplam süre</dt><dd>{formatTime(stats.playSeconds)}</dd></div>
        </dl>
      </div>
    </ScreenFrame>
  )
}

export function CreditsScreen({ onBack }: { onBack: () => void }) {
  return (
    <ScreenFrame eyebrow="MERBUT" title="Yapımcılar" onBack={onBack} className="credits-screen">
      <div className="credits-roll">
        {CREDITS.map((block) => (
          <section key={block.role}><small>{block.role}</small>{block.names.map((name) => <strong key={name}>{name}</strong>)}</section>
        ))}
        <p>Bu yapım hayal ürünüdür. Tarihî ve dinî şahsiyetlere saygıyla yaklaşılmıştır. Anılan karakter ve markalar sahiplerine aittir.</p>
      </div>
    </ScreenFrame>
  )
}

export function PatchNotes({ onBack }: { onBack: () => void }) {
  return (
    <ScreenFrame eyebrow={`SÜRÜM v${APP_VERSION}`} title="Yama notları" onBack={onBack} className="patch-notes">
      <div className="patch-notes__list">
        {PATCH_NOTES.map((release) => (
          <article key={release.version}>
            <header><strong>v{release.version}</strong><small>{release.title}</small></header>
            <ul>{release.notes.map((note) => <li key={note}>{note}</li>)}</ul>
          </article>
        ))}
      </div>
    </ScreenFrame>
  )
}
