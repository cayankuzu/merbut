import { useEffect, useState } from 'react'
import { gameAudio } from '../audio/gameAudio'
import { biomeTitle } from '../config/biomes'
import { DIFFICULTIES, DIFFICULTY_ORDER, difficultyText } from '../config/difficulty'
import { biomeText } from '../content/biomeContent'
import { useLocale, useStrings, type Strings } from '../i18n'
import { useProgressStore } from '../meta/progressStore'
import { useSessionStore } from '../store/sessionStore'
import { useSettingsStore } from '../store/settingsStore'
import { useUiStore } from '../store/uiStore'
import type { CharacterId } from '../types/character'
import type { PlayerAction } from '../types/controls'
import { CharacterPreview3D } from './CharacterPreview3D'
import { ActionKeys } from './ui/KeyCap'

type FlowStrings = Strings['flow']

const MOVES: { action: PlayerAction; both?: PlayerAction; label: (s: FlowStrings, id: CharacterId) => string }[] = [
  { action: 'left', both: 'right', label: (s) => s.moveMove },
  { action: 'jump', label: (s) => s.moveJumpTwice },
  { action: 'attack', label: (s, id) => (id === 'ali' ? s.moveAttackAli : s.moveAttackJack) },
  { action: 'dash', label: (s) => s.moveDodgeRing },
  { action: 'ability', label: (s, id) => (id === 'ali' ? s.moveAbilityAli : s.moveAbilityJack) },
  { action: 'rotateLeft', both: 'rotateRight', label: (s) => s.moveTurn360 },
]

function HeroBrief({ id, ready }: { id: CharacterId; ready: boolean }) {
  const s = useStrings()
  return (
    <article className={`hero-brief hero-brief--${id}`}>
      {ready ? <CharacterPreview3D id={id} /> : <div className="character-preview" aria-hidden="true" />}
      <div className="hero-brief__copy">
        <h2>{s.common.heroName(id)}</h2>
        <p>{id === 'ali' ? s.flow.heroBlurbAli : s.flow.heroBlurbJack}</p>
        <dl>{MOVES.map((move) => <div key={move.action}><dt><ActionKeys player={id} action={move.action} both={move.both} /></dt><dd>{move.label(s.flow, id)}</dd></div>)}</dl>
      </div>
    </article>
  )
}

export function ControlsScreen() {
  const [previewsReady, setPreviewsReady] = useState(false)
  const pendingBiome = useUiStore((state) => state.pendingBiome)
  const difficulty = useSessionStore((state) => state.difficulty)
  const setDifficulty = useSessionStore((state) => state.setDifficulty)
  const returnToMenu = useSessionStore((state) => state.returnToMenu)
  const showPrologue = useSettingsStore((state) => state.showPrologue)
  const prologueSeen = useProgressStore((state) => state.prologueSeen)
  const locale = useLocale()
  const s = useStrings()

  useEffect(() => {
    const timer = window.setTimeout(() => setPreviewsReady(true), 180)
    return () => window.clearTimeout(timer)
  }, [])

  const start = () => {
    gameAudio.play('ui-confirm')
    const session = useSessionStore.getState()
    if (pendingBiome > 0) session.startAtBiome(pendingBiome)
    else if (showPrologue || !prologueSeen) session.startPrologue()
    else {
      session.returnToMenu()
      useSessionStore.getState().startCountdown()
    }
  }

  const realm = biomeTitle(pendingBiome, locale).toLocaleUpperCase(locale === 'tr' ? 'tr-TR' : 'en-US')
  return (
    <section className="controls-screen" aria-label={s.flow.briefingAria}>
      <header>
        <small>{s.flow.briefingKicker(biomeText(pendingBiome, locale).chapter, realm)}</small>
        <h1>{s.flow.briefingTitle}</h1>
      </header>
      <div className="controls-screen__grid">
        <HeroBrief id="ali" ready={previewsReady} />
        <HeroBrief id="jack" ready={previewsReady} />
      </div>
      <fieldset className="difficulty-select">
        <legend>{s.flow.difficultyLegend}</legend>
        {DIFFICULTY_ORDER.map((id) => {
          const option = DIFFICULTIES[id]
          const text = difficultyText(id, locale)
          return (
            <button className={difficulty === id ? 'is-selected' : ''} type="button" onClick={() => setDifficulty(id)} aria-pressed={difficulty === id} key={id}>
              <b>{text.label}</b>
              <span>{text.description}</span>
              <em>{s.flow.difficultyStats(option.playerHealth, option.playerLives, option.extraEnemies)}</em>
            </button>
          )
        })}
      </fieldset>
      <p className="controls-screen__note">{s.flow.briefingNote}</p>
      <div className="menu-actions">
        <button type="button" onClick={returnToMenu}>{s.common.back}</button>
        <button className="menu-primary" type="button" autoFocus onClick={start}>{s.flow.startBattle}</button>
      </div>
    </section>
  )
}
