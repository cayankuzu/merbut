import { useSessionStore } from '../store/sessionStore'
import { BossCinematicOverlay } from './BossCinematicOverlay'
import { ControlsScreen } from './ControlsScreen'
import { EndingOverlay } from './EndingOverlay'
import { CombatHud } from './hud/CombatHud'
import { BiomeTitleCard, DamageVignette, DialogueOverlay, Toasts } from './hud/Overlays'
import { MainMenu } from './MainMenu'
import { PauseMenu } from './PauseMenu'
import { ResultScreen } from './ResultScreen'
import { PrologueCinematic } from './story/PrologueCinematic'

export function GameInterface() {
  const phase = useSessionStore((state) => state.phase)
  const countdown = useSessionStore((state) => state.countdown)
  return (
    <div className="interface-layer">
      <DamageVignette />
      <CombatHud />
      <BiomeTitleCard />
      <BossCinematicOverlay />
      <EndingOverlay />
      <DialogueOverlay />
      <Toasts />
      {phase === 'menu' ? <MainMenu /> : null}
      {phase === 'controls' ? <ControlsScreen /> : null}
      {phase === 'prologue' ? <PrologueCinematic /> : null}
      {phase === 'countdown' ? <div className="countdown" aria-live="assertive" key={Math.ceil(countdown)}>{Math.ceil(countdown)}</div> : null}
      {phase === 'paused' ? <PauseMenu /> : null}
      {phase === 'victory' ? <ResultScreen victory /> : null}
      {phase === 'defeat' ? <ResultScreen victory={false} /> : null}
    </div>
  )
}
