import { useEffect } from 'react'
import { useAudioStore } from '../audio/audioStore'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'

export function SessionController() {
  const sessionToken = useSessionStore((state) => state.sessionToken)

  useEffect(() => {
    useGameStore.getState().resetScene()
  }, [sessionToken])

  useEffect(() => {
    let previous = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      const delta = Math.max(0, (now - previous) / 1_000)
      previous = now
      const session = useSessionStore.getState()
      if (['countdown', 'boss-intro', 'final-intro', 'playing', 'ending'].includes(session.phase)) {
        session.tick(delta, now)
      }
    }, 50)
    return () => window.clearInterval(timer)
  }, [])

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
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return null
}
