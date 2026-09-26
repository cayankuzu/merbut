import { useEffect, useRef, useState } from 'react'
import { gameAudio } from '../audio/gameAudio'
import { useAudioStore } from '../audio/audioStore'
import { DIFFICULTIES } from '../config/difficulty'
import { BIOMES } from '../config/biomes'
import { BIOME_CONTENT } from '../content/biomeContent'
import { useProgressStore } from '../meta/progressStore'
import { useSessionStore } from '../store/sessionStore'
import { useUiStore } from '../store/uiStore'
import { CharacterGallery } from './CharacterGallery'
import { MenuBattleStage, type MenuStageAction } from './MenuBattleStage'
import { AchievementsScreen, ChapterSelect, CreditsScreen, PatchNotes } from './menu/MenuScreens'
import { toggleFullscreen } from '../utils/fullscreen'

function TitleScreen({ onContinue }: { onContinue: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.code === 'Tab') return
      // Swallow the key so it cannot also "click" the menu entry that gains focus next.
      event.preventDefault()
      window.setTimeout(onContinue, 0)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('merbut-any-input', onContinue)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('merbut-any-input', onContinue)
    }
  }, [onContinue])
  return (
    <button className="title-screen" type="button" onClick={onContinue} aria-label="Başlamak için bir tuşa bas">
      <small>MEMODE SUNAR</small>
      <h1 data-title="MERBUT">MERBUT</h1>
      <em>On Diyar · Tek Kader</em>
      <span className="title-screen__prompt">Başlamak için bir tuşa bas</span>
    </button>
  )
}

interface MenuEntry {
  id: string
  label: string
  hint: string
  primary?: boolean
  action: () => void
}

export function MainMenu() {
  const view = useUiStore((state) => state.view)
  const setView = useUiStore((state) => state.setView)
  const setPendingBiome = useUiStore((state) => state.setPendingBiome)
  const [transition, setTransition] = useState<MenuStageAction>('idle')
  const [stageReady, setStageReady] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const transitionTimer = useRef<number | null>(null)
  const checkpoint = useProgressStore((state) => state.checkpoint)
  const showControls = useSessionStore((state) => state.showControls)
  const setDifficulty = useSessionStore((state) => state.setDifficulty)
  const openSettings = useAudioStore((state) => state.openPanel)

  useEffect(() => () => {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current)
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(() => setStageReady(true), 120)
    return () => window.clearTimeout(timer)
  }, [])

  const strike = (next: Exclude<MenuStageAction, 'idle'>, then: () => void) => {
    if (transition !== 'idle') return
    setTransition(next)
    gameAudio.unlock()
    gameAudio.play(next === 'heroes' ? 'menu-hero-strike' : 'menu-enemy-strike')
    transitionTimer.current = window.setTimeout(() => {
      then()
      setTransition('idle')
      transitionTimer.current = null
    }, 720)
  }

  const beginBriefing = (biome: number) => {
    setPendingBiome(biome)
    strike('heroes', showControls)
  }

  if (view === 'title') {
    return (
      <section className="menu-screen menu-screen--title" aria-label="Başlık">
        {stageReady ? <MenuBattleStage action="idle" /> : null}
        <TitleScreen onContinue={() => { gameAudio.unlock(); gameAudio.play('ui-confirm'); setView('main') }} />
      </section>
    )
  }
  if (view === 'characters') return <CharacterGallery onClose={() => setView('main')} />
  if (view === 'chapters') return <ChapterSelect onBack={() => setView('main')} onPick={beginBriefing} />
  if (view === 'achievements') return <AchievementsScreen onBack={() => setView('main')} />
  if (view === 'credits') return <CreditsScreen onBack={() => setView('main')} />
  if (view === 'patch-notes') return <PatchNotes onBack={() => setView('main')} />

  const entries: MenuEntry[] = [
    ...(checkpoint ? [{
      id: 'continue',
      label: 'DEVAM ET',
      hint: `${BIOME_CONTENT[checkpoint.biome]!.chapter} · ${BIOMES[checkpoint.biome]!.title} · ${DIFFICULTIES[checkpoint.difficulty].label}`,
      primary: true,
      action: () => {
        setDifficulty(checkpoint.difficulty)
        beginBriefing(checkpoint.biome)
      },
    }] : []),
    { id: 'new', label: 'YENİ OYUN', hint: 'Prologla başlayan yolculuk: on diyar, iki boss ve bir portal.', primary: !checkpoint, action: () => beginBriefing(0) },
    { id: 'chapters', label: 'BÖLÜM SEÇ', hint: 'Ulaştığın diyarlardan birinden yeniden başla.', action: () => setView('chapters') },
    { id: 'characters', label: 'KARAKTERLER', hint: 'Kahramanlar, Aku Lejyonu ve bosslar: 360° arşiv.', action: () => strike('enemies', () => setView('characters')) },
    { id: 'achievements', label: 'BAŞARIMLAR', hint: 'Açtığın başarımlar, rekorların ve istatistiklerin.', action: () => setView('achievements') },
    { id: 'settings', label: 'AYARLAR', hint: 'Görüntü, ses, kontroller, oynanış ve erişilebilirlik.', action: openSettings },
    { id: 'credits', label: 'YAPIMCILAR', hint: 'Merbut’u yapanlar ve teşekkürler.', action: () => setView('credits') },
  ]
  const hint = entries.find((entry) => entry.id === focused)?.hint ?? entries[0]!.hint

  return (
    <section className={`menu-screen menu-screen--battle is-${transition}`} aria-label="Ana menü">
      {stageReady ? <MenuBattleStage action={transition} composition="duel" /> : <div className="menu-battle-stage menu-battle-stage--placeholder" aria-hidden="true" />}
      <div className="main-menu">
        <header>
          <h1 data-title="MERBUT">MERBUT</h1>
          <em>On Diyar · Tek Kader</em>
        </header>
        <nav aria-label="Ana menü seçenekleri">
          {entries.map((entry, index) => (
            <button
              key={entry.id}
              className={entry.primary ? 'menu-primary' : undefined}
              type="button"
              disabled={transition !== 'idle'}
              autoFocus={index === 0}
              onFocus={() => { setFocused(entry.id); gameAudio.play('ui-move') }}
              onMouseEnter={() => setFocused(entry.id)}
              onClick={() => { gameAudio.play('ui-confirm'); entry.action() }}
            >
              <span>{entry.label}</span>
            </button>
          ))}
        </nav>
        <p className="main-menu__hint" aria-live="polite">{hint}</p>
      </div>
      <div className="menu-corner">
        <button type="button" onClick={() => setView('patch-notes')}>YAMA NOTLARI</button>
        <button type="button" onClick={toggleFullscreen} aria-label="Tam ekranı aç veya kapat">⛶ TAM EKRAN</button>
      </div>
    </section>
  )
}
