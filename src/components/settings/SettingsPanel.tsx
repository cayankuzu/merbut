import { useEffect, useRef, useState } from 'react'
import { useAudioStore, type VolumeChannel } from '../../audio/audioStore'
import { gameAudio } from '../../audio/gameAudio'
import { gamepads } from '../../input/gamepadManager'
import { keyLabel, padLabel, useInputLabels } from '../../input/keyLabels'
import { BIOMES, biomeTitle } from '../../config/biomes'
import { LOCALES, LOCALE_NAMES, useLocale, useStrings, type Locale, type Strings } from '../../i18n'
import { ACHIEVEMENTS } from '../../meta/achievements'
import { useProgressStore } from '../../meta/progressStore'
import { resetEverything, resetProgress } from '../../meta/resetData'
import { useDebugStore } from '../../store/debugStore'
import { useSessionStore } from '../../store/sessionStore'
import { useSettingsStore, type DialogueSpeed, type TextScale } from '../../store/settingsStore'
import { useTutorialStore } from '../../store/tutorialStore'
import { PLAYER_ACTIONS, type PlayerAction } from '../../types/controls'
import type { CharacterId } from '../../types/character'
import { toggleFullscreen } from '../../utils/fullscreen'
import { GraphicsSettingsPanel } from '../GraphicsSettingsPanel'
import { KeyCap } from '../ui/KeyCap'

type SettingsStrings = Strings['settings']

type Tab = 'display' | 'audio' | 'controls' | 'gameplay' | 'access' | 'data'
const TABS: readonly Tab[] = ['display', 'audio', 'controls', 'gameplay', 'access', 'data']

function tabLabel(tab: Tab, s: SettingsStrings) {
  switch (tab) {
    case 'display': return s.tabDisplay
    case 'audio': return s.tabAudio
    case 'controls': return s.tabControls
    case 'gameplay': return s.tabGameplay
    case 'access': return s.tabAccess
    case 'data': return s.tabData
  }
}

function actionName(action: PlayerAction, s: SettingsStrings) {
  switch (action) {
    case 'left': return s.actionLeft
    case 'right': return s.actionRight
    case 'jump': return s.actionJump
    case 'attack': return s.actionAttack
    case 'ability': return s.actionAbility
    case 'dash': return s.actionDash
    case 'rotateLeft': return s.actionRotateLeft
    case 'rotateRight': return s.actionRotateRight
  }
}

function Slider({ label, value, onChange, min = 0, max = 100, step = 1, format = (v: number) => `${Math.round(v)}%` }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number; format?: (value: number) => string }) {
  return (
    <label className="setting-row setting-row--slider">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <b>{format(value)}</b>
    </label>
  )
}

function Toggle({ label, detail, value, onChange }: { label: string; detail?: string; value: boolean; onChange: (value: boolean) => void }) {
  const s = useStrings().settings
  return (
    <button type="button" className="setting-row setting-row--toggle" role="switch" aria-checked={value} onClick={() => onChange(!value)}>
      <span>{label}{detail ? <small>{detail}</small> : null}</span>
      <i aria-hidden="true">{value ? s.toggleOn : s.toggleOff}</i>
    </button>
  )
}

function Choice<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <div className="setting-row setting-row--choice" role="radiogroup" aria-label={label}>
      <span>{label}</span>
      <div>{options.map((option) => <button key={String(option.value)} type="button" role="radio" aria-checked={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>
    </div>
  )
}

function AudioTab() {
  const s = useStrings().settings
  const audio = useAudioStore()
  const channels: { id: VolumeChannel; label: string }[] = [
    { id: 'masterVolume', label: s.volumeMaster },
    { id: 'musicVolume', label: s.volumeMusic },
    { id: 'sfxVolume', label: s.volumeSfx },
    { id: 'ambienceVolume', label: s.volumeAmbience },
    { id: 'voiceVolume', label: s.volumeVoice },
  ]
  return (
    <>
      {channels.map((channel) => <Slider key={channel.id} label={channel.label} value={audio[channel.id] * 100} onChange={(value) => audio.setVolume(channel.id, value / 100)} />)}
      <Toggle label={s.musicToggle} detail={s.musicToggleDetail} value={audio.musicPlaying} onChange={audio.setMusicPlaying} />
      <button className="setting-action" type="button" onClick={() => { gameAudio.unlock(); gameAudio.play('kill-impact') }}>{s.testEffect}</button>
    </>
  )
}

function DisplayTab({ onCameraPreview }: { onCameraPreview: (active: boolean) => void }) {
  const strings = useStrings()
  const s = strings.settings
  const language = useLocale()
  const cameraDistance = useDebugStore((state) => state.cameraDistance)
  const setCameraDistance = useDebugStore((state) => state.setCameraDistance)
  const textScale = useSettingsStore((state) => state.textScale)
  const update = useSettingsStore((state) => state.update)
  return (
    <>
      <Choice<Locale> label={strings.common.language} value={language} onChange={(value) => update({ language: value })} options={LOCALES.map((locale) => ({ value: locale, label: LOCALE_NAMES[locale] }))} />
      <GraphicsSettingsPanel />
      <button className="setting-action" type="button" onClick={toggleFullscreen}>{s.fullscreen}</button>
      <label className="setting-row setting-row--slider" onPointerDown={() => onCameraPreview(true)}>
        <span>{s.cameraDistance}</span>
        <input aria-label={s.cameraDistance} type="range" min="11.5" max="20.5" step="0.1" value={cameraDistance} onChange={(event) => setCameraDistance(Number(event.target.value))} />
        <b>{cameraDistance.toFixed(1)}</b>
      </label>
      <Choice<TextScale> label={s.textScale} value={textScale} onChange={(value) => update({ textScale: value })} options={[{ value: 1, label: s.textScaleNormal }, { value: 1.15, label: s.textScaleLarge }, { value: 1.3, label: s.textScaleHuge }]} />
    </>
  )
}

function Rebinder({ player }: { player: CharacterId }) {
  const strings = useStrings()
  const s = strings.settings
  const { locale } = useInputLabels()
  const bindings = useSettingsStore((state) => state.bindings[player])
  const setBinding = useSettingsStore((state) => state.setBinding)
  const [listening, setListening] = useState<PlayerAction | null>(null)
  useEffect(() => {
    if (!listening) return
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopImmediatePropagation()
      if (event.code !== 'Escape') setBinding(player, listening, event.code)
      setListening(null)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [listening, player, setBinding])
  return (
    <article className="rebinder">
      <h3>{strings.common.heroName(player)}</h3>
      {PLAYER_ACTIONS.map((action) => (
        <button key={action} type="button" className={listening === action ? 'is-listening' : ''} onClick={() => setListening(action)}>
          <span>{actionName(action, s)}</span>
          {listening === action ? <em>{s.pressKey}</em> : <KeyCap>{keyLabel(bindings[action], locale)}</KeyCap>}
          <KeyCap pad>{padLabel(action)}</KeyCap>
        </button>
      ))}
    </article>
  )
}

function ControlsTab() {
  const strings = useStrings()
  const s = strings.settings
  const resetBindings = useSettingsStore((state) => state.resetBindings)
  const swapGamepads = useSettingsStore((state) => state.swapGamepads)
  const slots = useSettingsStore((state) => state.gamepadSlots)
  const { padCount } = useInputLabels()
  return (
    <>
      <div className="rebinder-grid"><Rebinder player="ali" /><Rebinder player="jack" /></div>
      <div className="gamepad-status">
        <strong>{s.gamepadCount(padCount)}</strong>
        {(['ali', 'jack'] as const).map((id) => (
          <span key={id}>{strings.common.heroName(id)}: {padCount > slots[id] ? gamepads.name(slots[id]) || s.gamepadSlot(slots[id] + 1) : s.gamepadWaiting(slots[id] + 1)}</span>
        ))}
        <button className="setting-action" type="button" onClick={swapGamepads}>{s.swapGamepads}</button>
      </div>
      <button className="setting-action" type="button" onClick={resetBindings}>{s.resetBindings}</button>
    </>
  )
}

function GameplayTab() {
  const s = useStrings().settings
  const settings = useSettingsStore()
  const resetTutorial = useTutorialStore((state) => state.reset)
  return (
    <>
      <Toggle label={s.damageNumbers} value={settings.damageNumbers} onChange={(value) => settings.update({ damageNumbers: value })} />
      <Toggle label={s.tutorialHints} detail={s.tutorialHintsDetail} value={settings.tutorialHints} onChange={(value) => settings.update({ tutorialHints: value })} />
      <Toggle label={s.showPrologue} value={settings.showPrologue} onChange={(value) => settings.update({ showPrologue: value })} />
      <Choice<DialogueSpeed> label={s.dialogueSpeed} value={settings.dialogueSpeed} onChange={(value) => settings.update({ dialogueSpeed: value })} options={[{ value: 'slow', label: s.dialogueSlow }, { value: 'normal', label: s.dialogueNormal }, { value: 'fast', label: s.dialogueFast }, { value: 'instant', label: s.dialogueInstant }]} />
      <button className="setting-action" type="button" onClick={resetTutorial}>{s.replayHints}</button>
    </>
  )
}

function AccessibilityTab() {
  const s = useStrings().settings
  const settings = useSettingsStore()
  return (
    <>
      <Slider label={s.screenShake} value={settings.screenShake * 100} onChange={(value) => settings.update({ screenShake: value / 100 })} />
      <Toggle label={s.reduceFlashes} detail={s.reduceFlashesDetail} value={settings.reduceFlashes} onChange={(value) => settings.update({ reduceFlashes: value })} />
      <Toggle label={s.colorSafe} detail={s.colorSafeDetail} value={settings.colorSafeTelegraphs} onChange={(value) => settings.update({ colorSafeTelegraphs: value })} />
      <p className="setting-note">{s.accessibilityNote}</p>
    </>
  )
}

type ResetScope = 'progress' | 'everything'

function resetCopy(scope: ResetScope, s: SettingsStrings) {
  return scope === 'progress'
    ? { title: s.resetProgressTitle, detail: s.resetProgressDetail, confirm: s.resetProgressConfirm }
    : { title: s.resetEverythingTitle, detail: s.resetEverythingDetail, confirm: s.resetEverythingConfirm }
}

function DataTab() {
  const s = useStrings().settings
  const locale = useLocale()
  const phase = useSessionStore((state) => state.phase)
  const furthest = useProgressStore((state) => state.furthestBiome)
  const checkpoint = useProgressStore((state) => state.checkpoint)
  const unlocked = useProgressStore((state) => Object.keys(state.achievements).length)
  const stats = useProgressStore((state) => state.stats)
  const [pending, setPending] = useState<ResetScope | null>(null)
  const [done, setDone] = useState(false)
  const cancelButton = useRef<HTMLButtonElement>(null)
  const onMenu = phase === 'menu'
  const pendingCopy = pending ? resetCopy(pending, s) : null

  useEffect(() => {
    if (pending) cancelButton.current?.focus()
  }, [pending])

  const confirm = () => {
    if (!pending) return
    gameAudio.play('kill-impact')
    if (pending === 'everything') {
      resetEverything()
      return
    }
    resetProgress()
    setPending(null)
    setDone(true)
  }

  return (
    <>
      <dl className="save-summary" aria-label={s.saveSummary}>
        <div><dt>{s.summaryRealms}</dt><dd>{furthest + 1} / {BIOMES.length}</dd></div>
        <div><dt>{s.summaryCheckpoint}</dt><dd>{checkpoint ? (BIOMES[checkpoint.biome] ? biomeTitle(checkpoint.biome, locale) : '—') : s.summaryNone}</dd></div>
        <div><dt>{s.summaryAchievements}</dt><dd>{unlocked} / {ACHIEVEMENTS.length}</dd></div>
        <div><dt>{s.summaryVictories}</dt><dd>{stats.victories} / {stats.runs}</dd></div>
      </dl>
      {done ? <p className="setting-note save-reset__done" role="status">{s.resetDone}</p> : null}
      {pendingCopy ? (
        <div className="save-reset__confirm" role="alertdialog" aria-labelledby="save-reset-title" aria-describedby="save-reset-detail">
          <strong id="save-reset-title">{s.resetQuestion(pendingCopy.title)}</strong>
          <p id="save-reset-detail">{pendingCopy.detail} <b>{s.resetIrreversible}</b></p>
          <div>
            <button ref={cancelButton} className="setting-action" type="button" onClick={() => setPending(null)}>{s.resetCancel}</button>
            <button className="setting-action setting-action--danger" type="button" onClick={confirm}>{pendingCopy.confirm}</button>
          </div>
        </div>
      ) : (
        <div className="save-reset">
          {(['progress', 'everything'] as const).map((scope) => {
            const copy = resetCopy(scope, s)
            return (
              <button key={scope} className="setting-row setting-row--danger" type="button" disabled={!onMenu} onClick={() => { setDone(false); setPending(scope) }}>
                <span>{copy.title}<small>{copy.detail}</small></span>
                <i aria-hidden="true">{s.resetBadge}</i>
              </button>
            )
          })}
        </div>
      )}
      {onMenu ? null : <p className="setting-note">{s.resetMenuOnly}</p>}
    </>
  )
}

export function SettingsPanel() {
  const strings = useStrings()
  const s = strings.settings
  const [tab, setTab] = useState<Tab>('display')
  const [previewingCamera, setPreviewingCamera] = useState(false)
  const panelOpen = useAudioStore((state) => state.panelOpen)
  const closePanel = useAudioStore((state) => state.closePanel)
  const phase = useSessionStore((state) => state.phase)

  useEffect(() => {
    if (!panelOpen || phase === 'menu' || phase === 'paused' || phase === 'controls') return
    closePanel()
  }, [closePanel, panelOpen, phase])

  useEffect(() => {
    const stop = () => setPreviewingCamera(false)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('is-camera-previewing', previewingCamera)
    return () => document.documentElement.classList.remove('is-camera-previewing')
  }, [previewingCamera])
  const cameraDistance = useDebugStore((state) => state.cameraDistance)

  if (!panelOpen) return null
  return (
    <aside className={`settings-panel${previewingCamera ? ' is-camera-preview' : ''}`} role="dialog" aria-modal="true" aria-label={s.dialogLabel}>
      <div className="settings-panel__frame">
        <header>
          <div><small>{s.eyebrow}</small><h2>{tabLabel(tab, s)}</h2></div>
          <button type="button" onClick={closePanel} aria-label={s.closeLabel}>{strings.common.close} ×</button>
        </header>
        <nav role="tablist" aria-label={s.tabListLabel}>
          {TABS.map((entry) => <button key={entry} role="tab" type="button" aria-selected={tab === entry} autoFocus={entry === tab} onClick={() => { setTab(entry); gameAudio.play('ui-move') }}>{tabLabel(entry, s)}</button>)}
        </nav>
        <div className="settings-panel__body" role="tabpanel">
          {tab === 'display' ? <DisplayTab onCameraPreview={setPreviewingCamera} /> : null}
          {tab === 'audio' ? <AudioTab /> : null}
          {tab === 'controls' ? <ControlsTab /> : null}
          {tab === 'gameplay' ? <GameplayTab /> : null}
          {tab === 'access' ? <AccessibilityTab /> : null}
          {tab === 'data' ? <DataTab /> : null}
        </div>
        <footer><button className="menu-primary" type="button" onClick={closePanel}>{strings.common.back}</button></footer>
      </div>
      {previewingCamera ? <output className="camera-preview-readout">{s.cameraReadout(cameraDistance.toFixed(1))}</output> : null}
    </aside>
  )
}
