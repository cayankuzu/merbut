import { useEffect, useRef, useState } from 'react'
import { useAudioStore, type VolumeChannel } from '../../audio/audioStore'
import { gameAudio } from '../../audio/gameAudio'
import { gamepads } from '../../input/gamepadManager'
import { keyLabel, padLabel, useInputLabels } from '../../input/keyLabels'
import { BIOMES } from '../../config/biomes'
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

type Tab = 'display' | 'audio' | 'controls' | 'gameplay' | 'access' | 'data'
const TABS: { id: Tab; label: string }[] = [
  { id: 'display', label: 'Görüntü' },
  { id: 'audio', label: 'Ses' },
  { id: 'controls', label: 'Kontroller' },
  { id: 'gameplay', label: 'Oynanış' },
  { id: 'access', label: 'Erişilebilirlik' },
  { id: 'data', label: 'Kayıt' },
]

const ACTION_NAMES: Record<PlayerAction, string> = {
  left: 'Sola', right: 'Sağa', jump: 'Zıpla', attack: 'Saldır', ability: 'Özel yetenek', dash: 'Kaçın', rotateLeft: 'Sola dön', rotateRight: 'Sağa dön',
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
  return (
    <button type="button" className="setting-row setting-row--toggle" role="switch" aria-checked={value} onClick={() => onChange(!value)}>
      <span>{label}{detail ? <small>{detail}</small> : null}</span>
      <i aria-hidden="true">{value ? 'AÇIK' : 'KAPALI'}</i>
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
  const audio = useAudioStore()
  const channels: { id: VolumeChannel; label: string }[] = [
    { id: 'masterVolume', label: 'Ana ses' },
    { id: 'musicVolume', label: 'Müzik' },
    { id: 'sfxVolume', label: 'Efektler' },
    { id: 'ambienceVolume', label: 'Ortam' },
    { id: 'voiceVolume', label: 'Diyalog sesi' },
  ]
  return (
    <>
      {channels.map((channel) => <Slider key={channel.id} label={channel.label} value={audio[channel.id] * 100} onChange={(value) => audio.setVolume(channel.id, value / 100)} />)}
      <Toggle label="Müzik" detail="Özgün, oyun durumuna göre değişen müzik" value={audio.musicPlaying} onChange={audio.setMusicPlaying} />
      <button className="setting-action" type="button" onClick={() => { gameAudio.unlock(); gameAudio.play('kill-impact') }}>Efekti dinle</button>
    </>
  )
}

function DisplayTab({ onCameraPreview }: { onCameraPreview: (active: boolean) => void }) {
  const cameraDistance = useDebugStore((state) => state.cameraDistance)
  const setCameraDistance = useDebugStore((state) => state.setCameraDistance)
  const textScale = useSettingsStore((state) => state.textScale)
  const update = useSettingsStore((state) => state.update)
  return (
    <>
      <GraphicsSettingsPanel />
      <button className="setting-action" type="button" onClick={toggleFullscreen}>Tam ekranı aç / kapat</button>
      <label className="setting-row setting-row--slider" onPointerDown={() => onCameraPreview(true)}>
        <span>Kamera uzaklığı</span>
        <input aria-label="Kamera uzaklığı" type="range" min="11.5" max="20.5" step="0.1" value={cameraDistance} onChange={(event) => setCameraDistance(Number(event.target.value))} />
        <b>{cameraDistance.toFixed(1)}</b>
      </label>
      <Choice<TextScale> label="Arayüz boyutu" value={textScale} onChange={(value) => update({ textScale: value })} options={[{ value: 1, label: 'Normal' }, { value: 1.15, label: 'Büyük' }, { value: 1.3, label: 'Çok büyük' }]} />
    </>
  )
}

function Rebinder({ player }: { player: CharacterId }) {
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
      <h3>{player === 'ali' ? 'Hz. Ali' : 'Samuray Jack'}</h3>
      {PLAYER_ACTIONS.map((action) => (
        <button key={action} type="button" className={listening === action ? 'is-listening' : ''} onClick={() => setListening(action)}>
          <span>{ACTION_NAMES[action]}</span>
          {listening === action ? <em>Bir tuşa bas… (Esc iptal)</em> : <KeyCap>{keyLabel(bindings[action])}</KeyCap>}
          <KeyCap pad>{padLabel(action)}</KeyCap>
        </button>
      ))}
    </article>
  )
}

function ControlsTab() {
  const resetBindings = useSettingsStore((state) => state.resetBindings)
  const swapGamepads = useSettingsStore((state) => state.swapGamepads)
  const slots = useSettingsStore((state) => state.gamepadSlots)
  const { padCount } = useInputLabels()
  return (
    <>
      <div className="rebinder-grid"><Rebinder player="ali" /><Rebinder player="jack" /></div>
      <div className="gamepad-status">
        <strong>Gamepad · {padCount} bağlı</strong>
        <span>Hz. Ali: {padCount > slots.ali ? gamepads.name(slots.ali) || `Kol ${slots.ali + 1}` : `Kol ${slots.ali + 1} bekleniyor`}</span>
        <span>Samuray Jack: {padCount > slots.jack ? gamepads.name(slots.jack) || `Kol ${slots.jack + 1}` : `Kol ${slots.jack + 1} bekleniyor`}</span>
        <button className="setting-action" type="button" onClick={swapGamepads}>Kolları değiştir</button>
      </div>
      <button className="setting-action" type="button" onClick={resetBindings}>Varsayılan tuşlara dön</button>
    </>
  )
}

function GameplayTab() {
  const settings = useSettingsStore()
  const resetTutorial = useTutorialStore((state) => state.reset)
  return (
    <>
      <Toggle label="Hasar sayıları" value={settings.damageNumbers} onChange={(value) => settings.update({ damageNumbers: value })} />
      <Toggle label="Öğretici ipuçları" detail="Yeni hareketleri oyun içinde gösterir" value={settings.tutorialHints} onChange={(value) => settings.update({ tutorialHints: value })} />
      <Toggle label="Yeni oyunda prolog" value={settings.showPrologue} onChange={(value) => settings.update({ showPrologue: value })} />
      <Choice<DialogueSpeed> label="Diyalog hızı" value={settings.dialogueSpeed} onChange={(value) => settings.update({ dialogueSpeed: value })} options={[{ value: 'slow', label: 'Yavaş' }, { value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Hızlı' }, { value: 'instant', label: 'Anında' }]} />
      <button className="setting-action" type="button" onClick={resetTutorial}>İpuçlarını baştan göster</button>
    </>
  )
}

function AccessibilityTab() {
  const settings = useSettingsStore()
  return (
    <>
      <Slider label="Ekran sarsıntısı" value={settings.screenShake * 100} onChange={(value) => settings.update({ screenShake: value / 100 })} />
      <Toggle label="Parlama ve flaşları azalt" detail="Vuruş flaşı ve kırmızı ekran nabzı kapanır" value={settings.reduceFlashes} onChange={(value) => settings.update({ reduceFlashes: value })} />
      <Toggle label="Renk körlüğü dostu uyarılar" detail="Saldırı uyarısı kırmızı yerine sarı-beyaz yanar, yerdeki halka büyür" value={settings.colorSafeTelegraphs} onChange={(value) => settings.update({ colorSafeTelegraphs: value })} />
      <p className="setting-note">İşletim sisteminde “hareketi azalt” açıksa sarsıntı otomatik olarak düşürülür. Saldırı uyarıları renge ek olarak şekil (yerdeki halka) ve sesle de verilir.</p>
    </>
  )
}

type ResetScope = 'progress' | 'everything'

const RESET_COPY: Record<ResetScope, { title: string; detail: string; confirm: string }> = {
  progress: {
    title: 'İlerlemeyi sıfırla',
    detail: 'Açılan diyarlar, kayıt noktası, en iyi süreler ve rütbeler, başarımlar, istatistikler, prolog ve ipuçları silinir. Tuşların, sesin ve grafik ayarların kalır.',
    confirm: 'EVET, İLERLEMEYİ SİL',
  },
  everything: {
    title: 'Fabrika ayarlarına dön',
    detail: 'İlerlemeye ek olarak tuş atamaları, ses, grafik ve erişilebilirlik ayarları da varsayılana döner. Oyun yeniden başlar.',
    confirm: 'EVET, HER ŞEYİ SIFIRLA',
  },
}

function DataTab() {
  const phase = useSessionStore((state) => state.phase)
  const furthest = useProgressStore((state) => state.furthestBiome)
  const checkpoint = useProgressStore((state) => state.checkpoint)
  const unlocked = useProgressStore((state) => Object.keys(state.achievements).length)
  const stats = useProgressStore((state) => state.stats)
  const [pending, setPending] = useState<ResetScope | null>(null)
  const [done, setDone] = useState(false)
  const cancelButton = useRef<HTMLButtonElement>(null)
  const onMenu = phase === 'menu'

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
      <dl className="save-summary" aria-label="Kayıt özeti">
        <div><dt>Açılan diyar</dt><dd>{furthest + 1} / {BIOMES.length}</dd></div>
        <div><dt>Kayıt noktası</dt><dd>{checkpoint ? BIOMES[checkpoint.biome]?.title ?? '—' : 'Yok'}</dd></div>
        <div><dt>Başarım</dt><dd>{unlocked} / {ACHIEVEMENTS.length}</dd></div>
        <div><dt>Galibiyet</dt><dd>{stats.victories} / {stats.runs}</dd></div>
      </dl>
      {done ? <p className="setting-note save-reset__done" role="status">İlerleme sıfırlandı. Yolculuk en baştan, Aku Metropolü’nden başlar.</p> : null}
      {pending ? (
        <div className="save-reset__confirm" role="alertdialog" aria-labelledby="save-reset-title" aria-describedby="save-reset-detail">
          <strong id="save-reset-title">{RESET_COPY[pending].title}?</strong>
          <p id="save-reset-detail">{RESET_COPY[pending].detail} <b>Bu işlem geri alınamaz.</b></p>
          <div>
            <button ref={cancelButton} className="setting-action" type="button" onClick={() => setPending(null)}>VAZGEÇ</button>
            <button className="setting-action setting-action--danger" type="button" onClick={confirm}>{RESET_COPY[pending].confirm}</button>
          </div>
        </div>
      ) : (
        <div className="save-reset">
          {(['progress', 'everything'] as const).map((scope) => (
            <button key={scope} className="setting-row setting-row--danger" type="button" disabled={!onMenu} onClick={() => { setDone(false); setPending(scope) }}>
              <span>{RESET_COPY[scope].title}<small>{RESET_COPY[scope].detail}</small></span>
              <i aria-hidden="true">SIFIRLA</i>
            </button>
          ))}
        </div>
      )}
      {onMenu ? null : <p className="setting-note">Sıfırlama sürmekte olan bir yolculuğu bozmasın diye yalnızca ana menüden yapılabilir.</p>}
    </>
  )
}

export function SettingsPanel() {
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
    <aside className={`settings-panel${previewingCamera ? ' is-camera-preview' : ''}`} role="dialog" aria-modal="true" aria-label="Ayarlar">
      <div className="settings-panel__frame">
        <header>
          <div><small>MERBUT · AYARLAR</small><h2>{TABS.find((entry) => entry.id === tab)!.label}</h2></div>
          <button type="button" onClick={closePanel} aria-label="Ayarları kapat">KAPAT ×</button>
        </header>
        <nav role="tablist" aria-label="Ayar sekmeleri">
          {TABS.map((entry) => <button key={entry.id} role="tab" type="button" aria-selected={tab === entry.id} autoFocus={entry.id === tab} onClick={() => { setTab(entry.id); gameAudio.play('ui-move') }}>{entry.label}</button>)}
        </nav>
        <div className="settings-panel__body" role="tabpanel">
          {tab === 'display' ? <DisplayTab onCameraPreview={setPreviewingCamera} /> : null}
          {tab === 'audio' ? <AudioTab /> : null}
          {tab === 'controls' ? <ControlsTab /> : null}
          {tab === 'gameplay' ? <GameplayTab /> : null}
          {tab === 'access' ? <AccessibilityTab /> : null}
          {tab === 'data' ? <DataTab /> : null}
        </div>
        <footer><button className="menu-primary" type="button" onClick={closePanel}>GERİ</button></footer>
      </div>
      {previewingCamera ? <output className="camera-preview-readout">KAMERA · {cameraDistance.toFixed(1)}</output> : null}
    </aside>
  )
}
