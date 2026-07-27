import { useSessionStore } from '../store/sessionStore'
import { ControlsScreen } from './ControlsScreen'
import { GameHud } from './GameHud'
import { MainMenu } from './MainMenu'
import { PauseMenu } from './PauseMenu'
import { ResultScreen } from './ResultScreen'
import { BossCinematicOverlay } from './BossCinematicOverlay'
import { EndingOverlay } from './EndingOverlay'
import { AudioSettingsPanel } from './AudioSettingsPanel'

export function GameInterface() {
  const phase = useSessionStore((state) => state.phase)
  const countdown = useSessionStore((state) => state.countdown)
  return (
    <div className="interface-layer">
      <GameHud />
      <BossCinematicOverlay />
      <EndingOverlay />
      <AudioSettingsPanel />
      {phase === 'menu' ? <MainMenu /> : null}
      {phase === 'controls' ? <ControlsScreen /> : null}
      {phase === 'countdown' ? <div className="countdown" aria-live="assertive">{Math.ceil(countdown)}</div> : null}
      {phase === 'paused' ? <PauseMenu /> : null}
      {phase === 'victory' ? <ResultScreen victory /> : null}
      {phase === 'defeat' ? <ResultScreen victory={false} /> : null}
    </div>
  )
}
