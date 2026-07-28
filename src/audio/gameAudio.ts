type EnemyKind = 1 | 2 | 3 | 4 | 5
type EnemyVoice = `enemy-${EnemyKind}-${'hurt' | 'death'}`

export type SoundEffect =
  | 'ali-slash' | 'jack-slash' | 'ali-hurt' | 'ali-down' | 'jack-hurt' | 'jack-down'
  | 'ui-confirm' | 'menu-hero-strike' | 'menu-enemy-strike' | 'defeat'
  | EnemyVoice
  | 'shadow-hurt' | 'shadow-roar' | 'shadow-death'
  | 'aku-hurt' | 'aku-roar' | 'aku-death'
  | 'xp' | 'fireball' | 'shield' | 'heal' | 'wave' | 'portal' | 'time-portal'
  | 'stone-throw' | 'dark-orb' | 'aku-fire' | 'meteor-warning' | 'victory'

const MIN_INTERVAL: Record<SoundEffect, number> = {
  'ali-slash': 90, 'jack-slash': 90, 'ali-hurt': 220, 'ali-down': 700, 'jack-hurt': 220, 'jack-down': 700,
  'ui-confirm': 120, 'menu-hero-strike': 700, 'menu-enemy-strike': 700, defeat: 1_200,
  'enemy-1-hurt': 170, 'enemy-1-death': 260, 'enemy-2-hurt': 170, 'enemy-2-death': 260,
  'enemy-3-hurt': 190, 'enemy-3-death': 280, 'enemy-4-hurt': 190, 'enemy-4-death': 280,
  'enemy-5-hurt': 210, 'enemy-5-death': 300,
  'shadow-hurt': 250, 'shadow-roar': 850, 'shadow-death': 1_200,
  'aku-hurt': 260, 'aku-roar': 850, 'aku-death': 1_200,
  xp: 120, fireball: 180, shield: 600, heal: 300, wave: 600, portal: 650, 'time-portal': 420,
  'stone-throw': 180, 'dark-orb': 200, 'aku-fire': 180, 'meteor-warning': 520, victory: 1_500,
}

class GameAudioEngine {
  private context: AudioContext | null = null
  private noiseBuffer: AudioBuffer | null = null
  private volume = 0.78
  private lastPlayed = new Map<SoundEffect, number>()

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  unlock() {
    const context = this.getContext()
    if (context?.state === 'suspended') void context.resume()
  }

  suspend() {
    if (this.context?.state === 'running') void this.context.suspend()
  }

  play(effect: SoundEffect) {
    if (this.volume <= 0) return
    const now = performance.now()
    if (now - (this.lastPlayed.get(effect) ?? -Infinity) < MIN_INTERVAL[effect]) return
    const context = this.getContext()
    if (!context) return
    if (context.state === 'suspended') void context.resume()
    this.lastPlayed.set(effect, now)

    if (effect.startsWith('enemy-')) {
      const [, kindValue, state] = effect.split('-')
      const kind = Number(kindValue) as EnemyKind
      const death = state === 'death'
      const base = [0, 210, 176, 132, 98, 245][kind]!
      const wave: OscillatorType[] = ['sine', 'sawtooth', 'square', 'triangle', 'sawtooth', 'square']
      this.tone(base, death ? base * 0.19 : base * 0.57, death ? 0.62 + kind * 0.045 : 0.2 + kind * 0.024, death ? 0.17 : 0.1, wave[kind]!)
      this.noise(death ? 0.48 : 0.14, death ? 0.14 : 0.065, 380 + kind * 185, kind % 2 ? 'bandpass' : 'lowpass', kind * 0.008)
      if (kind === 4) this.tone(510, death ? 72 : 320, death ? 0.5 : 0.16, 0.055, 'triangle', 0.03)
      if (kind === 5) this.tone(690, death ? 46 : 880, death ? 0.7 : 0.19, 0.05, 'sine', 0.04)
      return
    }

    switch (effect) {
      case 'ali-slash':
        this.noise(0.14, 0.14, 2_250, 'highpass')
        this.tone(410, 1_040, 0.13, 0.08, 'sawtooth')
        this.tone(960, 360, 0.18, 0.045, 'sine', 0.035)
        break
      case 'jack-slash':
        this.noise(0.2, 0.12, 3_100, 'highpass')
        this.tone(1_180, 240, 0.17, 0.075, 'triangle')
        this.tone(1_720, 680, 0.1, 0.045, 'sine', 0.025)
        break
      case 'ali-hurt':
        this.tone(284, 126, 0.27, 0.13, 'triangle'); this.noise(0.15, 0.06, 1_050, 'bandpass')
        break
      case 'ali-down':
        this.tone(390, 62, 0.82, 0.18, 'sawtooth'); this.noise(0.6, 0.1, 620, 'bandpass')
        break
      case 'jack-hurt':
        this.tone(196, 92, 0.31, 0.14, 'square'); this.noise(0.18, 0.055, 1_420, 'highpass')
        break
      case 'jack-down':
        this.tone(520, 88, 0.74, 0.16, 'triangle'); this.tone(176, 44, 0.86, 0.09, 'square', 0.08)
        break
      case 'ui-confirm':
        this.tone(520, 780, 0.09, 0.07, 'sine')
        this.tone(780, 1_040, 0.1, 0.05, 'triangle', 0.055)
        break
      case 'menu-hero-strike':
        this.noise(0.42, 0.16, 2_800, 'highpass')
        this.tone(260, 1_240, 0.46, 0.13, 'sawtooth')
        this.tone(740, 1_480, 0.28, 0.08, 'triangle', 0.12)
        break
      case 'menu-enemy-strike':
        this.tone(118, 34, 0.76, 0.22, 'square')
        this.noise(0.62, 0.19, 510, 'bandpass')
        this.tone(76, 210, 0.52, 0.1, 'sawtooth', 0.16)
        break
      case 'defeat':
        this.tone(246, 33, 1.4, 0.2, 'sawtooth'); this.tone(116, 22, 1.6, 0.13, 'square', 0.16); this.noise(1.1, 0.12, 280, 'lowpass')
        break
      case 'shadow-hurt':
        this.tone(164, 74, 0.34, 0.14, 'sawtooth'); this.noise(0.22, 0.08, 720, 'bandpass')
        break
      case 'shadow-roar':
        this.tone(92, 38, 0.9, 0.25, 'sawtooth'); this.tone(61, 31, 1.05, 0.16, 'square'); this.noise(0.95, 0.16, 240, 'lowpass')
        break
      case 'shadow-death':
        this.tone(145, 24, 1.35, 0.26, 'sawtooth'); this.noise(1.2, 0.21, 330, 'lowpass'); this.tone(54, 18, 1.5, 0.17, 'square', 0.2)
        break
      case 'aku-hurt':
        this.tone(118, 238, 0.32, 0.13, 'square'); this.noise(0.25, 0.075, 1_180, 'bandpass')
        break
      case 'aku-roar':
        this.tone(74, 146, 1.05, 0.24, 'square'); this.tone(220, 42, 0.92, 0.16, 'sawtooth'); this.noise(1, 0.18, 640, 'bandpass')
        break
      case 'aku-death':
        this.tone(280, 21, 1.55, 0.25, 'square'); this.tone(880, 48, 1.3, 0.1, 'sine', 0.08); this.noise(1.45, 0.2, 920, 'bandpass')
        break
      case 'xp':
        this.tone(660, 880, 0.11, 0.09, 'sine'); this.tone(880, 1_320, 0.14, 0.08, 'sine', 0.08)
        break
      case 'fireball':
        this.noise(0.38, 0.18, 1_100, 'bandpass'); this.tone(180, 760, 0.34, 0.12, 'sawtooth')
        break
      case 'shield':
        this.tone(360, 1_100, 0.48, 0.13, 'sine'); this.tone(540, 1_450, 0.55, 0.08, 'triangle', 0.06)
        break
      case 'heal':
        this.tone(440, 660, 0.3, 0.1, 'sine'); this.tone(660, 990, 0.42, 0.08, 'sine', 0.16)
        break
      case 'wave':
        this.tone(82, 164, 0.65, 0.18, 'sawtooth'); this.noise(0.45, 0.1, 420, 'lowpass')
        break
      case 'portal':
        this.tone(780, 42, 0.9, 0.18, 'sine'); this.noise(0.8, 0.12, 1_500, 'bandpass')
        break
      case 'time-portal':
        this.tone(1_360, 86, 0.62, 0.12, 'triangle'); this.tone(340, 1_020, 0.55, 0.07, 'sine', 0.06); this.noise(0.5, 0.08, 2_200, 'bandpass')
        break
      case 'stone-throw':
        this.noise(0.2, 0.16, 310, 'lowpass'); this.tone(104, 62, 0.22, 0.1, 'triangle')
        break
      case 'dark-orb':
        this.tone(188, 620, 0.48, 0.1, 'square'); this.tone(740, 124, 0.5, 0.055, 'sine', 0.04)
        break
      case 'aku-fire':
        this.noise(0.44, 0.17, 1_620, 'bandpass'); this.tone(96, 920, 0.4, 0.1, 'sawtooth')
        break
      case 'meteor-warning':
        this.tone(72, 44, 0.7, 0.18, 'square'); this.tone(440, 220, 0.52, 0.06, 'triangle', 0.12); this.noise(0.55, 0.09, 260, 'lowpass')
        break
      case 'victory':
        ;[392, 523, 659, 784].forEach((frequency, index) => this.tone(frequency, frequency * 1.08, 0.5, 0.1, 'triangle', index * 0.13))
        break
    }
  }

  private getContext() {
    if (typeof window === 'undefined') return null
    const AudioContextConstructor = window.AudioContext
      ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextConstructor) return null
    this.context ??= new AudioContextConstructor({ latencyHint: 'interactive' })
    return this.context
  }

  private getNoiseBuffer(context: AudioContext) {
    if (this.noiseBuffer) return this.noiseBuffer
    const buffer = context.createBuffer(1, context.sampleRate * 1.5, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1
    this.noiseBuffer = buffer
    return buffer
  }

  private tone(startFrequency: number, endFrequency: number, duration: number, level: number, type: OscillatorType, delay = 0) {
    const context = this.context
    if (!context) return
    const start = context.currentTime + delay
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(Math.max(1, startFrequency), start)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, level * this.volume), start + 0.018)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.03)
  }

  private noise(duration: number, level: number, frequency: number, type: BiquadFilterType, delay = 0) {
    const context = this.context
    if (!context) return
    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()
    source.buffer = this.getNoiseBuffer(context)
    filter.type = type
    filter.frequency.value = frequency
    filter.Q.value = type === 'bandpass' ? 1.8 : 0.7
    const start = context.currentTime + delay
    gain.gain.setValueAtTime(Math.max(0.0001, level * this.volume), start)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    source.connect(filter).connect(gain).connect(context.destination)
    source.start(start)
    source.stop(start + duration + 0.02)
  }
}

export const gameAudio = new GameAudioEngine()
