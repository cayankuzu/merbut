import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { AudioDirector } from '../audio/AudioDirector'
import { useAudioStore } from '../audio/audioStore'
import { MusicDirector } from '../audio/MusicDirector'
import { GameInterface } from '../components/GameInterface'
import { GraphicsAutoNotice } from '../components/GraphicsAutoNotice'
import { LoadingScreen } from '../components/LoadingScreen'
import { MobileUnsupported } from '../components/MobileUnsupported'
import { SessionController } from '../components/SessionController'
import { SettingsPanel } from '../components/settings/SettingsPanel'
import { APP_VERSION } from '../config/version'
import { Background } from '../game/Background'
import { startHitFeedback } from '../game/feedback/hitFeedback'
import { GameScene } from '../game/GameScene'
import { startInputLoop } from '../input/menuNavigation'
import { useProgressStore } from '../meta/progressStore'
import { startRunTracker } from '../meta/runTracker'
import { simClock } from '../sim/clock'
import { startEventBridge } from '../sim/eventBridge'
import { gameEvents } from '../sim/events'
import { useMechanicsStore } from '../sim/mechanics'
import { useGameStore } from '../store/gameStore'
import { usePerformanceStore } from '../store/performanceStore'
import { ACTIVE_PHASES, useSessionStore } from '../store/sessionStore'
import { useSettingsStore } from '../store/settingsStore'
import { startStoryDirector } from '../story/storyDirector'
import { isMobileDevice } from '../utils/deviceSupport'
import { labOff } from '../utils/labFlags'
import { ErrorBoundary } from './ErrorBoundary'
import '../styles/tokens.css'
import '../styles/screens/01-shell.css'
import '../styles/screens/02-menus-overlays.css'
import '../styles/screens/03-gallery-ending.css'
import '../styles/screens/04-graphics-settings.css'
import '../styles/screens/05-refinements.css'
import '../styles/game-ui.css'

const DebugCalibrationPanel = lazy(() =>
  import('../components/DebugCalibrationPanel').then((module) => ({
    default: module.DebugCalibrationPanel,
  })),
)

declare global {
  interface Window {
    __MERBUT__?: {
      getState: typeof useGameStore.getState
      getSessionState: typeof useSessionStore.getState
      setSessionState: typeof useSessionStore.setState
      getAudioState: typeof useAudioStore.getState
      getPerformanceState: typeof usePerformanceStore.getState
      getProgressState: typeof useProgressStore.getState
      getMechanicsState: typeof useMechanicsStore.getState
      setMechanicsState: typeof useMechanicsStore.setState
      now: () => number
      clock: typeof simClock
      events: typeof gameEvents
    }
  }
}

/** Presentation systems that listen to game events for the whole session. */
function useGameServices() {
  useEffect(() => {
    startInputLoop()
    const stops = [startEventBridge(), startHitFeedback(), startStoryDirector(), startRunTracker()]
    return () => stops.forEach((stop) => stop())
  }, [])
}

export default function App() {
  const [mobileUnsupported] = useState(isMobileDevice)
  const [assetsReady, setAssetsReady] = useState(false)
  const handleAssetsReady = useCallback(() => setAssetsReady(true), [])
  const debugEnabled = new URLSearchParams(window.location.search).get('debug') === '1'
  const phase = useSessionStore((state) => state.phase)
  const textScale = useSettingsStore((state) => state.textScale)
  const fracture = useMechanicsStore((state) => state.fracture)
  const inCombat = ACTIVE_PHASES.includes(phase)
  useGameServices()

  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__MERBUT__ = {
      getState: useGameStore.getState,
      getSessionState: useSessionStore.getState,
      setSessionState: useSessionStore.setState,
      getAudioState: useAudioStore.getState,
      getPerformanceState: usePerformanceStore.getState,
      getProgressState: useProgressStore.getState,
      getMechanicsState: useMechanicsStore.getState,
      setMechanicsState: useMechanicsStore.setState,
      now: simClock.now,
      clock: simClock,
      events: gameEvents,
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('is-in-combat', inCombat)
    document.documentElement.style.setProperty('--ui-scale', String(textScale))
  }, [inCombat, textScale])

  if (mobileUnsupported) return <MobileUnsupported />
  const showCopyright = phase === 'menu' || phase === 'controls' || phase === 'victory' || phase === 'defeat'

  return (
    <ErrorBoundary>
      <main className={`game-shell is-${phase}${fracture && inCombat ? ' is-fracture' : ''}`}>
        <AudioDirector />
        <MusicDirector />
        {assetsReady ? <>
          {labOff('backdrop') ? null : <Background />}
          <GameScene />
          <div className="scene-grade" aria-hidden="true" />
          <SessionController />
          {labOff('hud') ? null : <GameInterface />}
          <GraphicsAutoNotice />
          {debugEnabled ? (
            <Suspense fallback={null}>
              <DebugCalibrationPanel />
            </Suspense>
          ) : null}
        </> : null}
        <SettingsPanel />
        <LoadingScreen onReady={handleAssetsReady} />
      </main>
      {showCopyright ? (
        <footer className="merbut-copyright" aria-label="Telif hakkı ve yapımcı bilgisi">
          <span>© {new Date().getFullYear()} MERBUT</span>
          <i aria-hidden="true" />
          <span><strong>MeMoDe</strong> yapımı</span>
          <i aria-hidden="true" />
          <span className="merbut-copyright__version">SÜRÜM <strong>v{APP_VERSION}</strong></span>
        </footer>
      ) : null}
    </ErrorBoundary>
  )
}
