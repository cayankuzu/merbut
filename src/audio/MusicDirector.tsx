import { useEffect } from 'react'
import { useMechanicsStore } from '../sim/mechanics'
import { useSessionStore } from '../store/sessionStore'
import { ambience } from './ambience'
import { audioEngine } from './audioEngine'
import { useAudioStore } from './audioStore'
import { musicEngine } from './musicEngine'
import { biomeTheme, type ThemeId } from './musicThemes'

/** Picks the score for the current moment of the game. */
function chooseTheme(): ThemeId | null {
  const session = useSessionStore.getState()
  const phase = session.phase === 'paused' ? session.pausedPhase ?? 'playing' : session.phase
  if (phase === 'menu' || phase === 'controls') return 'menu'
  if (phase === 'prologue') return 'prologue'
  if (phase === 'defeat') return 'defeat'
  if (phase === 'ending' || phase === 'victory') return 'ending'
  const boss = session.enemies.find((enemy) => enemy.boss && enemy.animation !== 'dead')
  if (boss?.bossType === 'aku') return useMechanicsStore.getState().fracture ? 'fracture' : 'boss-aku'
  if (boss?.bossType === 'shadow') return 'boss-shadow'
  return biomeTheme(session.currentBiome)
}

function combatIntensity() {
  const session = useSessionStore.getState()
  if (session.phase === 'boss-intro' || session.phase === 'final-intro') return 1
  const living = session.enemies.filter((enemy) => enemy.animation !== 'dead' && enemy.biome === session.currentBiome).length
  return Math.min(1, living / 3)
}

function syncVolumes() {
  const audio = useAudioStore.getState()
  audioEngine.setLevel('master', audio.masterVolume)
  audioEngine.setLevel('music', audio.musicPlaying ? audio.musicVolume : 0)
  audioEngine.setLevel('sfx', audio.sfxVolume)
  audioEngine.setLevel('ambience', audio.ambienceVolume)
  audioEngine.setLevel('voice', audio.voiceVolume)
}

export function MusicDirector() {
  useEffect(() => {
    syncVolumes()
    const unsubscribe = useAudioStore.subscribe(syncVolumes)
    const update = () => {
      if (!audioEngine.ready || audioEngine.context?.state !== 'running') return
      const theme = chooseTheme()
      if (theme) musicEngine.play(theme)
      musicEngine.setIntensity(combatIntensity())
      const session = useSessionStore.getState()
      const inWorld = !['menu', 'controls', 'prologue'].includes(session.phase)
      if (inWorld) ambience.play(session.currentBiome)
      else ambience.stop()
    }
    const timer = window.setInterval(update, 400)
    const kick = () => window.setTimeout(update, 50)
    window.addEventListener('merbut-audio-unlocked', kick)
    return () => {
      unsubscribe()
      window.clearInterval(timer)
      window.removeEventListener('merbut-audio-unlocked', kick)
      musicEngine.stop()
      ambience.stop()
    }
  }, [])
  return null
}
