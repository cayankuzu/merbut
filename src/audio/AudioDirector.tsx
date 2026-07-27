import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'
import { useAudioStore } from './audioStore'
import { gameAudio, type SoundEffect } from './gameAudio'

const ACTIVE_PHASES = ['playing', 'boss-intro', 'final-intro', 'ending'] as const

function playEffect(effect: SoundEffect) {
  gameAudio.play(effect)
  useAudioStore.getState().noteEffect(effect)
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

    const unsubscribeGame = useGameStore.subscribe((state, previous) => {
      if (useSessionStore.getState().phase !== 'playing') return
      if (state.animationStates.ali === 'attack' && previous.animationStates.ali !== 'attack') playEffect('ali-slash')
      if (state.animationStates.jack === 'attack' && previous.animationStates.jack !== 'attack') playEffect('jack-slash')
    })

    const unsubscribeSession = useSessionStore.subscribe((state, previous) => {
      const active = ACTIVE_PHASES.includes(state.phase as typeof ACTIVE_PHASES[number])
      if (state.spawnedWaves.length > previous.spawnedWaves.length) playEffect('wave')
      if (state.projectiles.length > previous.projectiles.length) playEffect('fireball')
      if (state.enemyProjectiles.length > previous.enemyProjectiles.length) {
        const projectile = state.enemyProjectiles.at(-1)
        if (projectile) playEffect(projectile.kind === 'stone' ? 'stone-throw' : projectile.kind === 'dark-orb' ? 'dark-orb' : projectile.kind === 'time-portal' ? 'time-portal' : 'aku-fire')
      }
      if (state.meteors.length > previous.meteors.length) playEffect('meteor-warning')
      if (state.pickups.length < previous.pickups.length) playEffect('heal')
      if (state.players.jack.abilityActiveUntil > previous.players.jack.abilityActiveUntil) playEffect('shield')
      if (state.players.ali.kills > previous.players.ali.kills || state.players.jack.kills > previous.players.jack.kills) playEffect('xp')

      if (active) {
        for (const id of ['ali', 'jack'] as const) {
          const player = state.players[id]
          const oldPlayer = previous.players[id]
          if (player.health < oldPlayer.health) playEffect(`${id}-${player.dead && !oldPlayer.dead ? 'down' : 'hurt'}`)
        }

        for (const enemy of state.enemies) {
          const oldEnemy = previous.enemies.find((candidate) => candidate.id === enemy.id)
          if (!oldEnemy || enemy.health >= oldEnemy.health) continue
          const defeated = enemy.animation === 'dead' && oldEnemy.animation !== 'dead'
          if (enemy.bossType === 'aku') playEffect(defeated ? 'aku-death' : 'aku-hurt')
          else if (enemy.bossType === 'shadow') playEffect(defeated ? 'shadow-death' : 'shadow-hurt')
          else playEffect(`enemy-${enemy.kind}-${defeated ? 'death' : 'hurt'}`)
        }
      }

      if (state.phase !== previous.phase) {
        if (state.phase === 'boss-intro') playEffect('shadow-roar')
        if (state.phase === 'final-intro') playEffect('aku-roar')
        if (state.phase === 'defeat') playEffect('defeat')
      }
      if (state.bossPhase !== previous.bossPhase) {
        if (state.bossPhase === 'portal') playEffect('portal')
        if (state.bossPhase === 'continued') playEffect('victory')
      }
    })

    return () => {
      unsubscribeAudio()
      unsubscribeGame()
      unsubscribeSession()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])

  return null
}
