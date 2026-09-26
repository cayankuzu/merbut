import { useEffect } from 'react'
import { gameEvents, type GameEvent } from '../sim/events'
import { useGameStore } from '../store/gameStore'
import { useAudioStore } from './audioStore'
import { gameAudio, type SoundEffect } from './gameAudio'

function panFor(worldX?: number) {
  if (worldX === undefined) return 0
  const cameraX = useGameStore.getState().cameraX
  return Math.max(-0.9, Math.min(0.9, (worldX - cameraX) / 12))
}

function play(effect: SoundEffect, worldX?: number) {
  gameAudio.play(effect, panFor(worldX))
  useAudioStore.getState().noteEffect(effect)
}

const heroX = (id: 'ali' | 'jack') => useGameStore.getState().positions[id][0]

const HAZARD_SOUNDS: Record<string, Record<'warn' | 'strike', SoundEffect>> = {
  tide: { warn: 'tide-warn', strike: 'hazard-strike' },
  lava: { warn: 'lava-warn', strike: 'hazard-strike' },
  vent: { warn: 'lava-warn', strike: 'hazard-strike' },
  gust: { warn: 'gust-warn', strike: 'hazard-strike' },
  press: { warn: 'press-warn', strike: 'press-slam' },
  bolt: { warn: 'bolt-warn', strike: 'thunder' },
}

/** Maps gameplay events to sounds. No store diffing: every cue has a cause. */
function onEvent(event: GameEvent) {
  switch (event.type) {
    case 'player-attack':
      play(event.id === 'ali' ? 'ali-slash' : 'jack-slash', event.x)
      if (event.step === 3) play('finisher', event.x)
      break
    case 'enemy-hit': {
      if (event.boss === 'aku') play(event.killed ? 'aku-death' : 'aku-hurt', event.x)
      else if (event.boss === 'shadow') play(event.killed ? 'shadow-death' : 'shadow-hurt', event.x)
      else play(`enemy-${event.kind}-${event.killed ? 'death' : 'hurt'}`, event.x)
      if (event.killed && event.variant === 'mirage') play('sand-burst', event.x)
      if (event.killed && (event.variant === 'drone' || event.variant === 'queen')) play('machine-break', event.x)
      if (event.source !== 'hazard') play(event.killed ? 'kill-impact' : 'hit-impact', event.x)
      break
    }
    case 'player-hit': play(`${event.id}-${event.down ? 'down' : 'hurt'}`, heroX(event.id)); break
    case 'player-dash': play(event.perfect ? 'perfect-dodge' : 'dash', heroX(event.id)); break
    case 'ability': play(event.ability === 'shield' ? 'shield' : 'fireball', heroX(event.id)); break
    case 'pickup': play('heal', heroX(event.id)); break
    case 'wave': play('wave'); break
    case 'enemy-shot': play(event.kind === 'stone' ? 'stone-throw' : event.kind === 'dark-orb' ? 'dark-orb' : event.kind === 'time-portal' ? 'time-portal' : 'aku-fire', event.x); break
    case 'meteor-warning': play('meteor-warning', event.x); break
    case 'enemy-windup': play('telegraph', event.x); break
    case 'biome-enter': play('biome-shift'); break
    case 'gate-open': play('gate-open', event.x); break
    case 'hazard': play(HAZARD_SOUNDS[event.name]?.[event.stage] ?? (event.stage === 'warn' ? 'lava-warn' : 'hazard-strike'), event.x); break
    case 'mechanic':
      if (event.name === 'neon') play('neon-break', event.x)
      else if (event.name === 'bell') play('bell', event.x)
      else if (event.name === 'resonance') play('resonance', event.x)
      else if (event.name === 'firefly') play('firefly', event.x)
      else if (event.name === 'hourglass') play('hourglass', event.x)
      else if (event.name === 'rod') play('rod-charge', event.x)
      else if (event.name === 'chain') play('chain-zap', event.x2 ?? event.x)
      else if (event.name === 'parry') play('parry', event.x)
      else if (event.name === 'team') play('team-strike', event.x)
      break
    case 'achievement': play('achievement'); break
    case 'phase':
      if (event.phase === 'boss-intro') play('shadow-roar')
      if (event.phase === 'final-intro') play('aku-roar')
      if (event.phase === 'defeat') play('defeat')
      break
    case 'boss-phase':
      if (event.phase === 'portal') play('portal')
      if (event.phase === 'continued') play('victory')
      break
    case 'boss-form': play(event.form === 'fracture' ? 'time-portal' : 'aku-roar'); break
    default: break
  }
}

export function AudioDirector() {
  useEffect(() => {
    gameAudio.setVolume(useAudioStore.getState().sfxVolume)
    const unsubscribeAudio = useAudioStore.subscribe((state, previous) => {
      if (state.sfxVolume !== previous.sfxVolume) gameAudio.setVolume(state.sfxVolume)
    })
    const unlock = () => {
      gameAudio.unlock()
      window.dispatchEvent(new CustomEvent('merbut-audio-unlocked'))
    }
    const visibility = () => {
      if (document.hidden) gameAudio.suspend()
      else gameAudio.unlock()
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    document.addEventListener('visibilitychange', visibility)
    const unsubscribeEvents = gameEvents.on(onEvent)
    return () => {
      unsubscribeAudio()
      unsubscribeEvents()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])

  return null
}
