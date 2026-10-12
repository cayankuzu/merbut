import { useEffect, useRef, useState } from 'react'
import { gameAudio } from '../audio/gameAudio'
import { useAudioStore } from '../audio/audioStore'
import { difficultyText } from '../config/difficulty'
import { IS_DEMO, isPlayableBiome, openFullGame } from '../config/edition'
import { biomeTitle } from '../config/biomes'
import { biomeText } from '../content/biomeContent'
import { useLocale, useStrings } from '../i18n'
import { useProgressStore } from '../meta/progressStore'
import { useSessionStore } from '../store/sessionStore'
import { useSettingsStore } from '../store/settingsStore'
import { useUiStore } from '../store/uiStore'
import { CharacterGallery } from './CharacterGallery'
import { MenuBattleStage, type MenuStageAction } from './MenuBattleStage'
import { AchievementsScreen, ChapterSelect, CreditsScreen, PatchNotes } from './menu/MenuScreens'
import { toggleFullscreen } from '../utils/fullscreen'

function TitleScreen({ onContinue }: { onContinue: () => void }) {
  const s = useStrings()
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
    <button className="title-screen" type="button" onClick={onContinue} aria-label={s.menu.pressAnyKey}>
      <small>{s.menu.presents}</small>
      <h1 data-title={s.common.gameTitle}>{s.common.gameTitle}</h1>
      <em>{s.common.gameSubtitle}</em>
      <span className="title-screen__prompt">{s.menu.pressAnyKey}</span>
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
  const s = useStrings()
  const locale = useLocale()
  const view = useUiStore((state) => state.view)
  const setView = useUiStore((state) => state.setView)
  const setPendingBiome = useUiStore((state) => state.setPendingBiome)
  const [transition, setTransition] = useState<MenuStageAction>('idle')
  const [stageReady, setStageReady] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const transitionTimer = useRef<number | null>(null)
  const savedCheckpoint = useProgressStore((state) => state.checkpoint)
  // A save from the full game can point past the demo; the demo only continues within its realms.
  const checkpoint = savedCheckpoint && isPlayableBiome(savedCheckpoint.biome) ? savedCheckpoint : null
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
      <section className="menu-screen menu-screen--title" aria-label={s.menu.titleSection}>
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
      label: s.menu.continueGame,
      hint: s.menu.continueHint(biomeText(checkpoint.biome, locale).chapter, biomeTitle(checkpoint.biome, locale), difficultyText(checkpoint.difficulty, locale).label),
      primary: true,
      action: () => {
        setDifficulty(checkpoint.difficulty)
        beginBriefing(checkpoint.biome)
      },
    }] : []),
    { id: 'new', label: s.menu.newGame, hint: s.menu.newGameHint, primary: !checkpoint, action: () => beginBriefing(0) },
    ...(IS_DEMO ? [{ id: 'full-game', label: s.menu.fullGame, hint: s.menu.fullGameHint, action: openFullGame }] : []),
    { id: 'chapters', label: s.menu.chapterSelect, hint: s.menu.chapterSelectHint, action: () => setView('chapters') },
    { id: 'characters', label: s.menu.characters, hint: s.menu.charactersHint, action: () => strike('enemies', () => setView('characters')) },
    { id: 'achievements', label: s.menu.achievements, hint: s.menu.achievementsHint, action: () => setView('achievements') },
    { id: 'settings', label: s.menu.settings, hint: s.menu.settingsHint, action: openSettings },
    { id: 'credits', label: s.menu.credits, hint: s.menu.creditsHint, action: () => setView('credits') },
  ]
  const hint = entries.find((entry) => entry.id === focused)?.hint ?? entries[0]!.hint

  return (
    <section className={`menu-screen menu-screen--battle is-${transition}`} aria-label={s.menu.mainMenu}>
      {stageReady ? <MenuBattleStage action={transition} composition="duel" /> : <div className="menu-battle-stage menu-battle-stage--placeholder" aria-hidden="true" />}
      <div className="main-menu">
        <header>
          <h1 data-title={s.common.gameTitle}>{s.common.gameTitle}</h1>
          <em>{s.common.gameSubtitle}{IS_DEMO ? <span className="main-menu__demo">{s.menu.demoBadge}</span> : null}</em>
        </header>
        <nav aria-label={s.menu.mainMenuOptions}>
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
        <button type="button" onClick={() => setView('patch-notes')}>{s.menu.patchNotes}</button>
        <button type="button" onClick={toggleFullscreen} aria-label={s.menu.fullscreenLabel}>{s.menu.fullscreen}</button>
        <button
          className="menu-corner__language"
          type="button"
          aria-label={s.menu.languageToggleLabel}
          onClick={() => { gameAudio.play('ui-confirm'); useSettingsStore.getState().update({ language: locale === 'tr' ? 'en' : 'tr' }) }}
        >
          {s.menu.languageToggle}
        </button>
      </div>
    </section>
  )
}
