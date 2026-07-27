import { useCallback, useEffect, useRef, useState } from 'react'
import { useAudioStore } from '../audio/audioStore'
import { gameAudio } from '../audio/gameAudio'
import { useDebugStore } from '../store/debugStore'
import { useSessionStore } from '../store/sessionStore'
import { MusicTransportControls, type MusicCommandDetail } from './MusicTransportControls'

const MUSIC_URL = 'https://music.youtube.com/watch?v=Pp0xs_xpTYo&si=yebZejnX9bZByr_Z'
const EMBED_URL = 'https://www.youtube.com/embed/Pp0xs_xpTYo?enablejsapi=1&playsinline=1&loop=1&playlist=Pp0xs_xpTYo&controls=0&rel=0'

export function AudioSettingsPanel() {
  const iframe = useRef<HTMLIFrameElement>(null)
  const [playerReady, setPlayerReady] = useState(false)
  const [previewingCamera, setPreviewingCamera] = useState(false)
  const phase = useSessionStore((state) => state.phase)
  const panelOpen = useAudioStore((state) => state.panelOpen)
  const sfxVolume = useAudioStore((state) => state.sfxVolume)
  const musicVolume = useAudioStore((state) => state.musicVolume)
  const musicPlaying = useAudioStore((state) => state.musicPlaying)
  const musicLooping = useAudioStore((state) => state.musicLooping)
  const closePanel = useAudioStore((state) => state.closePanel)
  const setSfxVolume = useAudioStore((state) => state.setSfxVolume)
  const setMusicVolume = useAudioStore((state) => state.setMusicVolume)
  const cameraDistance = useDebugStore((state) => state.cameraDistance)
  const setCameraDistance = useDebugStore((state) => state.setCameraDistance)

  const command = useCallback((func: 'playVideo' | 'pauseVideo' | 'seekTo' | 'setLoop' | 'setVolume', args: unknown[] = []) => {
    iframe.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), 'https://www.youtube.com')
  }, [])

  useEffect(() => {
    if (!playerReady) return
    command('setVolume', [Math.round(musicVolume * 100)])
    command('setLoop', [musicLooping])
    command(musicPlaying ? 'playVideo' : 'pauseVideo')
  }, [command, musicLooping, musicPlaying, musicVolume, playerReady])

  useEffect(() => {
    const handleMusicCommand = (event: Event) => {
      const detail = (event as CustomEvent<MusicCommandDetail>).detail
      if (detail?.command !== 'rewind') return
      command('seekTo', [0, true])
      if (useAudioStore.getState().musicPlaying) command('playVideo')
    }
    window.addEventListener('merbut-music-command', handleMusicCommand)
    return () => window.removeEventListener('merbut-music-command', handleMusicCommand)
  }, [command])

  useEffect(() => {
    const unlockMusic = () => {
      if (!musicPlaying) return
      command('setVolume', [Math.round(musicVolume * 100)])
      command('playVideo')
    }
    window.addEventListener('merbut-audio-unlocked', unlockMusic)
    return () => window.removeEventListener('merbut-audio-unlocked', unlockMusic)
  }, [command, musicPlaying, musicVolume])

  useEffect(() => {
    const stopPreview = () => setPreviewingCamera(false)
    window.addEventListener('pointerup', stopPreview)
    window.addEventListener('pointercancel', stopPreview)
    return () => {
      window.removeEventListener('pointerup', stopPreview)
      window.removeEventListener('pointercancel', stopPreview)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('is-camera-previewing', previewingCamera)
    return () => document.documentElement.classList.remove('is-camera-previewing')
  }, [previewingCamera])

  useEffect(() => {
    if (!panelOpen || phase === 'menu' || phase === 'paused') return
    closePanel()
  }, [closePanel, panelOpen, phase])

  const testEffect = () => {
    gameAudio.unlock()
    gameAudio.play('ui-confirm')
    useAudioStore.getState().noteEffect('ui-confirm')
  }

  return (
    <aside className={`audio-settings${panelOpen ? ' is-open' : ''}${previewingCamera ? ' is-camera-preview' : ''}`} aria-label="Ayarlar" aria-hidden={!panelOpen} role="dialog" aria-modal={panelOpen}>
      <div className="audio-settings__panel pause-settings" hidden={!panelOpen}>
        <header><div><small>MERBUT · AYARLAR</small><h2>Ses, müzik ve kamera</h2></div><button type="button" onClick={closePanel} aria-label="Ayarları kapat">KAPAT ×</button></header>
        <div className="audio-settings__player pause-settings__music-preview">
          <iframe
            ref={iframe}
            src={EMBED_URL}
            title="Merbut fon müziği · YouTube"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setPlayerReady(true)}
          />
          <div><small>ŞİMDİ ÇALIYOR</small><strong>MERBUT · ARKA PLAN MÜZİĞİ</strong><a href={MUSIC_URL} target="_blank" rel="noreferrer">YOUTUBE MUSIC’TE AÇ ↗</a></div>
          <div className="pause-settings__wave" aria-hidden="true">{[1, 2, 3, 4, 5, 6, 7].map((bar) => <i key={bar} />)}</div>
        </div>
        <MusicTransportControls />
        <label><span>MÜZİK SEVİYESİ <b>{Math.round(musicVolume * 100)}%</b></span><input type="range" min="0" max="100" value={Math.round(musicVolume * 100)} onChange={(event) => setMusicVolume(Number(event.target.value) / 100)} /></label>
        <label><span>EFEKT SEVİYESİ <b>{Math.round(sfxVolume * 100)}%</b></span><input type="range" min="0" max="100" value={Math.round(sfxVolume * 100)} onChange={(event) => setSfxVolume(Number(event.target.value) / 100)} /></label>
        <button className="audio-settings__test pause-settings__test" type="button" onClick={testEffect}>EFEKTİ DİNLE</button>
        <label className="pause-settings__camera"><span>KAMERA UZAKLIĞI <b>{cameraDistance.toFixed(1)}</b></span><input aria-label="Kamera uzaklığı" type="range" min="11.5" max="20.5" step="0.1" value={cameraDistance} onPointerDown={() => setPreviewingCamera(true)} onChange={(event) => setCameraDistance(Number(event.target.value))} /></label>
        <p>Kamera çubuğunu sürüklerken panel gizlenir ve kadraj anlık ön izlenir.</p>
        <footer><button className="menu-primary" type="button" onClick={closePanel}>GERİ</button></footer>
      </div>
      {previewingCamera ? <output className="camera-preview-readout">KAMERA · {cameraDistance.toFixed(1)}</output> : null}
    </aside>
  )
}
