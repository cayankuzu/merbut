import { useEffect, useState } from 'react'
import { ASSET_PATHS } from '../../config/assetPaths'
import { ALI_FIREBALL_MAX_SHOTS, JACK_SHIELD_DURATION_MS } from '../../config/abilities'
import { BIOMES, biomeTitle } from '../../config/biomes'
import { bossTitle, enemyName } from '../../config/enemies'
import { biomeText } from '../../content/biomeContent'
import { useLocale, useStrings, type Locale, type Strings } from '../../i18n'
import { simClock } from '../../sim/clock'
import { AKU_FRACTURE_RATIO } from '../../sim/bosses'
import { useMechanicsStore } from '../../sim/mechanics'
import { getBiomeGateX } from '../../sim/biomeProgress'
import { useGameStore } from '../../store/gameStore'
import { useSessionStore } from '../../store/sessionStore'
import { useSettingsStore } from '../../store/settingsStore'
import { nextTutorialStep, useTutorialStore, type TutorialStep } from '../../store/tutorialStore'
import type { CharacterId } from '../../types/character'
import type { PlayerAction } from '../../types/controls'
import type { EnemyState } from '../../types/session'
import { ActionKeys } from '../ui/KeyCap'

const PORTRAITS: Record<CharacterId, string> = { ali: ASSET_PATHS.ui.aliHud, jack: ASSET_PATHS.ui.jackHud }
const HUD_PHASES = ['countdown', 'playing', 'boss-intro', 'final-intro', 'paused']

/** Re-renders a component a few times per second while it shows a live timer. */
function useTicker(active: boolean, hz = 10) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => setTick((tick) => tick + 1), 1_000 / hz)
    return () => window.clearInterval(timer)
  }, [active, hz])
}

function formatClock(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

const TUTORIAL_ACTION: Record<TutorialStep, { action: PlayerAction; both?: PlayerAction; text: keyof Strings['hud'] & `tutorial${string}` }> = {
  move: { action: 'left', both: 'right', text: 'tutorialMove' },
  jump: { action: 'jump', text: 'tutorialJump' },
  attack: { action: 'attack', text: 'tutorialAttack' },
  dash: { action: 'dash', text: 'tutorialDash' },
  ability: { action: 'ability', text: 'tutorialAbility' },
}

/** Bosses are named by their role, every other enemy by its kind and variant. */
function enemyTitle(enemy: EnemyState, locale: Locale) {
  if (enemy.bossType === 'shadow') return bossTitle('swamp', locale)
  if (enemy.bossType === 'aku') return bossTitle('final', locale)
  return enemyName(enemy.kind, enemy.variant, locale)
}

function TutorialHint({ id, abilityReady }: { id: CharacterId; abilityReady: boolean }) {
  const enabled = useSettingsStore((state) => state.tutorialHints)
  const s = useStrings()
  useTutorialStore((state) => state.learned[id].length)
  const step = enabled ? nextTutorialStep(id, abilityReady) : null
  if (!step) return null
  const hint = TUTORIAL_ACTION[step]
  return (
    <div className={`tutorial-hint tutorial-hint--${id}`} role="status">
      <ActionKeys player={id} action={hint.action} both={hint.both} />
      <span>{s.hud[hint.text]}</span>
    </div>
  )
}

function HeroCard({ id }: { id: CharacterId }) {
  const player = useSessionStore((state) => state.players[id])
  const s = useStrings()
  const name = s.common.heroName(id)
  const abilityName = s.hud.abilityName(id)
  const now = simClock.now()
  const abilityActive = player.abilityActiveUntil > now
  useTicker(abilityActive || player.frozenUntil > now || player.dead)
  const health = Math.max(0, Math.min(1, player.health / player.maxHealth))
  const remainingShots = Math.max(0, ALI_FIREBALL_MAX_SHOTS - player.abilityShots)
  const ability = abilityActive
    ? id === 'ali' ? remainingShots / ALI_FIREBALL_MAX_SHOTS : Math.max(0, player.abilityActiveUntil - now) / JACK_SHIELD_DURATION_MS
    : player.abilityCharge / 100
  const ready = !abilityActive && player.abilityCharge >= 100
  const status = player.dead
    ? player.lives > 0 ? s.hud.respawning(Math.max(0, (player.respawnAt - now) / 1_000).toFixed(1)) : s.hud.outOfAction
    : player.frozenUntil > now ? s.hud.timeFrozen : null
  const lowHealth = !player.dead && health < 0.3
  return (
    <section className={`hero-card hero-card--${id}${player.dead ? ' is-down' : ''}${lowHealth ? ' is-critical' : ''}${ready ? ' is-ready' : ''}`} aria-label={s.hud.heroStatus(name)}>
      <TutorialHint id={id} abilityReady={ready} />
      {player.combo >= 3 ? <div className="hero-card__combo" key={player.combo}><b>{player.combo}</b><span>{s.hud.combo}</span></div> : null}
      <div className="hero-card__portrait"><img src={PORTRAITS[id]} alt="" draggable={false} />{status ? <em>{status}</em> : null}</div>
      <div className="hero-card__body">
        <header>
          <h2>{name}</h2>
          <span className="hero-card__lives" aria-label={s.hud.lives(player.lives)}>{Array.from({ length: Math.max(player.lives, 0) }, (_, index) => <i key={index} />)}</span>
        </header>
        <div className="hero-card__health" role="meter" aria-valuemin={0} aria-valuemax={player.maxHealth} aria-valuenow={Math.ceil(player.health)} aria-label={s.hud.health}>
          <i className="hero-card__chip" style={{ width: `${health * 100}%` }} />
          <i className="hero-card__fill" style={{ width: `${health * 100}%` }} />
          <b>{Math.ceil(player.health)}</b>
        </div>
        <div className="hero-card__ability" aria-label={s.hud.abilityMeter(abilityName, Math.round(ability * 100))}>
          <i style={{ width: `${ability * 100}%` }} />
          <span>{abilityName}{abilityActive ? id === 'ali' ? ` · ${remainingShots}` : ` · ${s.hud.abilitySeconds((Math.max(0, player.abilityActiveUntil - now) / 1_000).toFixed(1))}` : ''}</span>
          {ready ? <ActionKeys player={id} action="ability" /> : null}
        </div>
        <footer><span>{s.hud.score(player.score)}</span><small>{s.hud.kills(player.kills)}</small></footer>
      </div>
    </section>
  )
}

function ObjectiveChip() {
  const biome = useSessionStore((state) => state.currentBiome)
  const threats = useSessionStore((state) => state.enemies.filter((enemy) => enemy.biome === state.currentBiome && enemy.animation !== 'dead' && !enemy.boss).length)
  const gateOpen = useSessionStore((state) => state.currentBiome < BIOMES.length - 1 && state.lockedRight > getBiomeGateX(state.currentBiome))
  const elapsed = useSessionStore((state) => Math.floor(state.elapsedSeconds))
  const s = useStrings()
  const locale = useLocale()
  return (
    <div className="objective-chip" role="status">
      <small>{biomeText(biome, locale).chapter}</small>
      <strong>{biomeTitle(biome, locale)}</strong>
      <span className={gateOpen ? 'is-go' : ''}>{gateOpen ? s.hud.gateOpen : threats > 0 ? s.hud.threats(threats) : s.hud.explore}</span>
      <time>{formatClock(elapsed)}</time>
    </div>
  )
}

function BossBar() {
  const boss = useSessionStore((state) => state.enemies.find((enemy) => enemy.boss && enemy.animation !== 'dead'))
  const fracture = useMechanicsStore((state) => state.fracture)
  const s = useStrings()
  const locale = useLocale()
  if (!boss) return null
  const ratio = Math.max(0, boss.health / boss.maxHealth)
  const title = enemyTitle(boss, locale)
  const form = boss.bossType === 'aku' ? fracture ? s.hud.bossFormFracture : boss.bossForm === 'monster' ? s.hud.bossFormMonster : s.hud.bossFormAku : s.hud.bossFormShadow
  const notches = boss.bossType === 'aku' ? [0.46, AKU_FRACTURE_RATIO] : [0.5]
  return (
    <div className={`boss-bar boss-bar--${boss.bossType}${fracture ? ' is-fracture' : ''}`} role="meter" aria-label={s.hud.bossHealth(title)} aria-valuenow={Math.round(ratio * 100)}>
      <header><strong>{title}</strong><small>{form}</small></header>
      <div className="boss-bar__track">
        <i className="boss-bar__chip" style={{ width: `${ratio * 100}%` }} />
        <i className="boss-bar__fill" style={{ width: `${ratio * 100}%` }} />
        {notches.map((notch) => <b key={notch} style={{ left: `${notch * 100}%` }} />)}
      </div>
    </div>
  )
}

function TogetherWarning() {
  const warning = useGameStore((state) => state.togetherWarning)
  const s = useStrings()
  return <div className={`together-warning${warning ? ' is-visible' : ''}`} role="alert" aria-hidden={!warning}>{s.hud.stayTogether}</div>
}

export function CombatHud() {
  const phase = useSessionStore((state) => state.phase)
  const s = useStrings()
  if (!HUD_PHASES.includes(phase)) return null
  return (
    <div className={`combat-hud${phase === 'paused' ? ' is-dimmed' : ''}`} aria-label={s.hud.combatInfo}>
      <ObjectiveChip />
      <BossBar />
      <TogetherWarning />
      <HeroCard id="ali" />
      <HeroCard id="jack" />
    </div>
  )
}
