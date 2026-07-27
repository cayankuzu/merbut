import { useAudioStore } from '../audio/audioStore'

export type MusicCommandDetail = { command: 'rewind' }

export function MusicTransportControls() {
  const musicPlaying = useAudioStore((state) => state.musicPlaying)
  const musicLooping = useAudioStore((state) => state.musicLooping)
  const setMusicPlaying = useAudioStore((state) => state.setMusicPlaying)
  const setMusicLooping = useAudioStore((state) => state.setMusicLooping)

  const rewind = () => {
    window.dispatchEvent(new CustomEvent<MusicCommandDetail>('merbut-music-command', { detail: { command: 'rewind' } }))
  }

  return (
    <div className="music-transport" role="group" aria-label="Müzik oynatma kontrolleri">
      <button type="button" onClick={() => setMusicPlaying(!musicPlaying)} aria-pressed={musicPlaying}>
        <span aria-hidden="true">{musicPlaying ? 'Ⅱ' : '▶'}</span>{musicPlaying ? 'DURAKLAT' : 'ÇAL'}
      </button>
      <button type="button" onClick={rewind}>
        <span aria-hidden="true">↶</span>BAŞA SAR
      </button>
      <button className="music-transport__loop" type="button" onClick={() => setMusicLooping(!musicLooping)} aria-pressed={musicLooping}>
        <span aria-hidden="true">↻</span>TEKRAR
      </button>
    </div>
  )
}
