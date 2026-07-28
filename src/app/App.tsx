import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { GameInterface } from '../components/GameInterface'
import { LoadingScreen } from '../components/LoadingScreen'
import { SessionController } from '../components/SessionController'
import { Background } from '../game/Background'
import { GameScene } from '../game/GameScene'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'
import { AudioDirector } from '../audio/AudioDirector'
import { useAudioStore } from '../audio/audioStore'
import { usePerformanceStore } from '../store/performanceStore'
import { APP_VERSION } from '../config/version'
import { AudioSettingsPanel } from '../components/AudioSettingsPanel'
import { GraphicsAutoNotice } from '../components/GraphicsAutoNotice'
import { MobileUnsupported } from '../components/MobileUnsupported'
import { isMobileDevice } from '../utils/deviceSupport'
import './app.css'

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
    }
  }
}

export default function App() {
  const [mobileUnsupported] = useState(isMobileDevice)
  const [assetsReady, setAssetsReady] = useState(false)
  const handleAssetsReady = useCallback(() => setAssetsReady(true), [])
  const debugEnabled = new URLSearchParams(window.location.search).get('debug') === '1'
  const paused = useSessionStore((state) => state.phase === 'paused')
  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__MERBUT__ = {
      getState: useGameStore.getState,
      getSessionState: useSessionStore.getState,
      setSessionState: useSessionStore.setState,
      getAudioState: useAudioStore.getState,
      getPerformanceState: usePerformanceStore.getState,
    }
  }, [])

  if (mobileUnsupported) return <MobileUnsupported />

  return (
    <>
      <main className={`game-shell${paused ? ' is-paused' : ''}`}>
        <AudioDirector />
        <AudioSettingsPanel />
        {assetsReady ? <>
          <Background />
          <GameScene />
          <div className="scene-grade" aria-hidden="true" />
          <SessionController />
          <GameInterface />
          <GraphicsAutoNotice />
          {debugEnabled ? (
            <Suspense fallback={null}>
              <DebugCalibrationPanel />
            </Suspense>
          ) : null}
        </> : null}
        <LoadingScreen onReady={handleAssetsReady} />
      </main>
      <footer className="merbut-copyright" aria-label="Telif hakkı ve yapımcı bilgisi">
        <span>© {new Date().getFullYear()} MERBUT</span>
        <i aria-hidden="true" />
        <span>TÜM HAKLARI SAKLIDIR</span>
        <i aria-hidden="true" />
        <span><strong>MeMoDe</strong> tarafından</span>
        <i aria-hidden="true" />
        <span className="merbut-copyright__version">SÜRÜM <strong>v{APP_VERSION}</strong></span>
      </footer>
    </>
  )
}
