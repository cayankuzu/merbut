import { useEffect, useState } from 'react'
import { ASSET_PATHS } from '../../config/assetPaths'
import { ALI_FIREBALL_MAX_SHOTS, JACK_SHIELD_DURATION_MS } from '../../config/abilities'
import { BIOMES } from '../../config/biomes'
import { BIOME_CONTENT } from '../../content/biomeContent'
import { simClock } from '../../sim/clock'
import { AKU_FRACTURE_RATIO } from '../../sim/bosses'
import { useMechanicsStore } from '../../sim/mechanics'
import { getBiomeGateX } from '../../sim/biomeProgress'
import { HERO_NAMES } from '../../sim/players'
import { useGameStore } from '../../store/gameStore'
import { useSessionStore } from '../../store/sessionStore'
import { useSettingsStore } from '../../store/settingsStore'
import { nextTutorialStep, useTutorialStore, type TutorialStep } from '../../store/tutorialStore'
import type { CharacterId } from '../../types/character'
import type { PlayerAction } from '../../types/controls'
import { ActionKeys } from '../ui/KeyCap'

const PORTRAITS: Record<CharacterId, string> = { ali: ASSET_PATHS.ui.aliHud, jack: ASSET_PATHS.ui.jackHud }
const ABILITY_NAMES: Record<CharacterId, string> = { ali: 'Alev Penceresi', jack: 'Koruyucu Kalkan' }
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

const TUTORIAL_ACTION: Record<TutorialStep, { action: PlayerAction; both?: PlayerAction; text: string }> = {
  move: { action: 'left', both: 'right', text: 'Yürü' },
  jump: { action: 'jump', text: 'Zıpla (havada bir kez daha)' },
  attack: { action: 'attack', text: 'Saldır' },
  dash: { action: 'dash', text: 'Kaç: kırmızı halkadan sıyrıl' },
  ability: { action: 'ability', text: 'Özel yetenek hazır!' },
}

function TutorialHint({ id, abilityReady }: { id: CharacterId; abilityReady: boolean }) {
  const enabled = useSettingsStore((state) => state.tutorialHints)
  useTutorialStore((state) => state.learned[id].length)
  const step = enabled ? nextTutorialStep(id, abilityReady) : null
  if (!step) return null
  const hint = TUTORIAL_ACTION[step]
  return (
    <div className={`tutorial-hint tutorial-hint--${id}`} role="status">
      <ActionKeys player={id} action={hint.action} both={hint.both} />
      <span>{hint.text}</span>
    </div>
  )
}

function HeroCard({ id }: { id: CharacterId }) {
  const player = useSessionStore((state) => state.players[id])
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
    ? player.lives > 0 ? `KALKIYOR · ${Math.max(0, (player.respawnAt - now) / 1_000).toFixed(1)}` : 'SAVAŞ DIŞI'
    : player.frozenUntil > now ? 'ZAMAN DONDU' : null
  const lowHealth = !player.dead && health < 0.3
  return (
    <section className={`hero-card hero-card--${id}${player.dead ? ' is-down' : ''}${lowHealth ? ' is-critical' : ''}${ready ? ' is-ready' : ''}`} aria-label={`${HERO_NAMES[id]} durumu`}>
      <TutorialHint id={id} abilityReady={ready} />
      {player.combo >= 3 ? <div className="hero-card__combo" key={player.combo}><b>{player.combo}</b><span>KOMBO</span></div> : null}
      <div className="hero-card__portrait"><img src={PORTRAITS[id]} alt="" draggable={false} />{status ? <em>{status}</em> : null}</div>
      <div className="hero-card__body">
        <header>
          <h2>{HERO_NAMES[id]}</h2>
          <span className="hero-card__lives" aria-label={`${player.lives} yaşam`}>{Array.from({ length: Math.max(player.lives, 0) }, (_, index) => <i key={index} />)}</span>
        </header>
        <div className="hero-card__health" role="meter" aria-valuemin={0} aria-valuemax={player.maxHealth} aria-valuenow={Math.ceil(player.health)} aria-label="Can">
          <i className="hero-card__chip" style={{ width: `${health * 100}%` }} />
          <i className="hero-card__fill" style={{ width: `${health * 100}%` }} />
          <b>{Math.ceil(player.health)}</b>
        </div>
        <div className="hero-card__ability" aria-label={`${ABILITY_NAMES[id]} yüzde ${Math.round(ability * 100)}`}>
          <i style={{ width: `${ability * 100}%` }} />
          <span>{ABILITY_NAMES[id]}{abilityActive ? id === 'ali' ? ` · ${remainingShots}` : ` · ${(Math.max(0, player.abilityActiveUntil - now) / 1_000).toFixed(1)} sn` : ''}</span>
          {ready ? <ActionKeys player={id} action="ability" /> : null}
        </div>
        <footer><span>{player.score.toLocaleString('tr-TR')}</span><small>{player.kills} yenilgi</small></footer>
      </div>
    </section>
  )
}

function ObjectiveChip() {
  const biome = useSessionStore((state) => state.currentBiome)
  const threats = useSessionStore((state) => state.enemies.filter((enemy) => enemy.biome === state.currentBiome && enemy.animation !== 'dead' && !enemy.boss).length)
  const gateOpen = useSessionStore((state) => state.currentBiome < BIOMES.length - 1 && state.lockedRight > getBiomeGateX(state.currentBiome))
  const elapsed = useSessionStore((state) => Math.floor(state.elapsedSeconds))
  const content = BIOME_CONTENT[biome]!
  return (
    <div className="objective-chip" role="status">
      <small>{content.chapter}</small>
      <strong>{BIOMES[biome]!.title}</strong>
      <span className={gateOpen ? 'is-go' : ''}>{gateOpen ? 'Kapı açık · ilerle ▸' : threats > 0 ? `${threats} tehdit` : 'Keşfet ▸'}</span>
      <time>{formatClock(elapsed)}</time>
    </div>
  )
}

function BossBar() {
  const boss = useSessionStore((state) => state.enemies.find((enemy) => enemy.boss && enemy.animation !== 'dead'))
  const fracture = useMechanicsStore((state) => state.fracture)
  if (!boss) return null
  const ratio = Math.max(0, boss.health / boss.maxHealth)
  const form = boss.bossType === 'aku' ? fracture ? 'ZAMAN KIRILMASI' : boss.bossForm === 'monster' ? 'CANAVAR FORMU' : 'ZAMANIN EFENDİSİ' : 'KARANLIK SAMURAY'
  const notches = boss.bossType === 'aku' ? [0.46, AKU_FRACTURE_RATIO] : [0.5]
  return (
    <div className={`boss-bar boss-bar--${boss.bossType}${fracture ? ' is-fracture' : ''}`} role="meter" aria-label={`${boss.title} canı`} aria-valuenow={Math.round(ratio * 100)}>
      <header><strong>{boss.title}</strong><small>{form}</small></header>
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
  return <div className={`together-warning${warning ? ' is-visible' : ''}`} role="alert" aria-hidden={!warning}>Birbirinizden kopmayın</div>
}

export function CombatHud() {
  const phase = useSessionStore((state) => state.phase)
  if (!HUD_PHASES.includes(phase)) return null
  return (
    <div className={`combat-hud${phase === 'paused' ? ' is-dimmed' : ''}`} aria-label="Savaş bilgileri">
      <ObjectiveChip />
      <BossBar />
      <TogetherWarning />
      <HeroCard id="ali" />
      <HeroCard id="jack" />
    </div>
  )
}
