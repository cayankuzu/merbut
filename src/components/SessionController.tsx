import { useEffect } from 'react'
import { useAudioStore } from '../audio/audioStore'
import { useGameStore } from '../store/gameStore'
import { ACTIVE_PHASES, useSessionStore } from '../store/sessionStore'
import { getClosedBiomeLeftLimit } from '../sim/biomeProgress'

/**
 * Session-level wiring that is not simulation: scene reset per run, Esc to
 * pause, and an automatic pause whenever the window loses focus or is hidden
 * (a two-player couch game must never keep fighting behind an alt-tab).
 */
export function SessionController() {
  const sessionToken = useSessionStore((state) => state.sessionToken)

  useEffect(() => {
    // Chapter starts place the heroes just inside that biome's rear gate.
    const startBiome = useSessionStore.getState().startBiome
    useGameStore.getState().resetScene(startBiome > 0 ? getClosedBiomeLeftLimit(startBiome) + 2.4 : 0)
  }, [sessionToken])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Escape') return
      const audio = useAudioStore.getState()
      if (audio.panelOpen) {
        audio.closePanel()
        return
      }
      const session = useSessionStore.getState()
      if (session.phase === 'paused') session.resume()
      else if (session.phase === 'controls') session.returnToMenu()
      else session.pause()
    }
    const autoPause = () => {
      const session = useSessionStore.getState()
      if (ACTIVE_PHASES.includes(session.phase)) session.pause()
    }
    const onVisibility = () => {
      if (document.hidden) autoPause()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('blur', autoPause)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('blur', autoPause)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return null
}
