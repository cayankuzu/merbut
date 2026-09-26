import { keyLabel, padLabel, useInputLabels } from '../../input/keyLabels'
import { useSettingsStore } from '../../store/settingsStore'
import type { CharacterId } from '../../types/character'
import type { PlayerAction } from '../../types/controls'

export function KeyCap({ children, pad = false }: { children: string; pad?: boolean }) {
  return <kbd className={`keycap${pad ? ' keycap--pad' : ''}`}>{children}</kbd>
}

/** The key (and pad button, when a pad is connected) that performs an action. */
export function ActionKeys({ player, action, both }: { player: CharacterId; action: PlayerAction; both?: PlayerAction }) {
  const { padCount } = useInputLabels()
  const bindings = useSettingsStore((state) => state.bindings[player])
  return (
    <span className="action-keys">
      <KeyCap>{keyLabel(bindings[action])}</KeyCap>
      {both ? <><i>/</i><KeyCap>{keyLabel(bindings[both])}</KeyCap></> : null}
      {padCount > 0 ? <KeyCap pad>{padLabel(action)}</KeyCap> : null}
    </span>
  )
}
