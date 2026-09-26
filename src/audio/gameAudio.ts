import { audioEngine, noise, tone } from './audioEngine'

type EnemyKind = 1 | 2 | 3 | 4 | 5
type EnemyVoice = `enemy-${EnemyKind}-${'hurt' | 'death'}`

export type SoundEffect =
  | 'ali-slash' | 'jack-slash' | 'ali-hurt' | 'ali-down' | 'jack-hurt' | 'jack-down'
  | 'hit-impact' | 'kill-impact' | 'dash' | 'perfect-dodge' | 'telegraph'
  | 'ui-confirm' | 'ui-move' | 'ui-back' | 'menu-hero-strike' | 'menu-enemy-strike' | 'defeat'
  | EnemyVoice
  | 'shadow-hurt' | 'shadow-roar' | 'shadow-death'
  | 'aku-hurt' | 'aku-roar' | 'aku-death'
  | 'fireball' | 'shield' | 'heal' | 'wave' | 'biome-shift' | 'gate-open' | 'portal' | 'time-portal'
  | 'stone-throw' | 'dark-orb' | 'aku-fire' | 'meteor-warning' | 'victory'
  | 'tide-warn' | 'lava-warn' | 'gust-warn' | 'hazard-strike'
  | 'neon-break' | 'bell' | 'resonance' | 'firefly' | 'achievement'
  | 'hourglass' | 'sand-burst' | 'press-warn' | 'press-slam' | 'machine-break'
  | 'rod-charge' | 'chain-zap' | 'bolt-warn' | 'thunder'
  | 'parry' | 'finisher' | 'team-strike' | 'sword-draw' | 'sword-sheathe'

/** Minimum spacing (ms) per cue so chained combat never turns into noise. */
const MIN_INTERVAL: Partial<Record<SoundEffect, number>> = {
  'ali-slash': 80, 'jack-slash': 80, 'ali-hurt': 200, 'jack-hurt': 200, 'ali-down': 700, 'jack-down': 700,
  'hit-impact': 45, 'kill-impact': 70, dash: 90, 'perfect-dodge': 400, telegraph: 110,
  'ui-move': 40, 'ui-confirm': 90, defeat: 1_200,
  'shadow-hurt': 220, 'aku-hurt': 220, 'shadow-roar': 850, 'aku-roar': 850,
  fireball: 150, shield: 600, heal: 300, wave: 600, 'biome-shift': 900, 'gate-open': 900,
  portal: 650, 'time-portal': 420, 'stone-throw': 160, 'dark-orb': 180, 'aku-fire': 160,
  'meteor-warning': 260, 'hazard-strike': 180, bell: 120, firefly: 200, achievement: 800,
  hourglass: 400, 'sand-burst': 60, 'press-warn': 300, 'press-slam': 200, 'machine-break': 70,
  'rod-charge': 500, 'chain-zap': 50, 'bolt-warn': 200, thunder: 250,
  parry: 90, finisher: 200, 'team-strike': 600, 'sword-draw': 300, 'sword-sheathe': 300,
}
const DEFAULT_INTERVAL = 150

/** Inharmonic partials of a struck bell (Rayleigh's ratios). */
function bell(frequency: number, level: number, pan: number, delay = 0, seconds = 3.2) {
  ;[[1, 1], [2.76, 0.55], [5.4, 0.3], [8.93, 0.16], [0.5, 0.35]].forEach(([ratio, weight]) => {
    tone({ from: frequency * ratio!, duration: seconds * (ratio! < 1 ? 1.2 : 1 / Math.sqrt(ratio!)), level: level * weight!, type: 'sine', delay, pan, attack: 0.004 })
  })
}

function taiko(level: number, pan: number, delay = 0) {
  tone({ from: 150, to: 52, duration: 0.55, level, type: 'sine', delay, pan, drive: 0.5 })
  noise({ duration: 0.12, level: level * 0.4, filter: 'lowpass', frequency: 900, to: 200, delay, pan })
}

class GameAudio {
  private lastPlayed = new Map<SoundEffect, number>()
  private variation = 1

  setVolume(volume: number) {
    audioEngine.setLevel('sfx', volume)
  }

  unlock() {
    audioEngine.resume()
  }

  suspend() {
    audioEngine.suspend()
  }

  play(effect: SoundEffect, pan = 0) {
    if (audioEngine.level('sfx') <= 0) return
    const now = performance.now()
    if (now - (this.lastPlayed.get(effect) ?? -Infinity) < (MIN_INTERVAL[effect] ?? DEFAULT_INTERVAL)) return
    const context = audioEngine.resume()
    if (!context) return
    this.lastPlayed.set(effect, now)
    // Tiny per-hit pitch variation keeps repeats from sounding like a sample.
    this.variation = 0.96 + Math.random() * 0.08
    const v = this.variation
    const p = Math.max(-1, Math.min(1, pan))

    if (effect.startsWith('enemy-')) {
      const [, kindValue, state] = effect.split('-')
      const kind = Number(kindValue) as EnemyKind
      const death = state === 'death'
      const base = ([0, 210, 176, 132, 98, 245][kind] ?? 180) * v
      const wave: OscillatorType[] = ['sine', 'sawtooth', 'square', 'triangle', 'sawtooth', 'square']
      tone({ from: base, to: death ? base * 0.22 : base * 0.6, duration: death ? 0.7 : 0.22, level: death ? 0.13 : 0.08, type: wave[kind], pan: p, filter: { type: 'bandpass', frequency: 700 + kind * 120, q: 1.4 }, drive: 0.35 })
      noise({ duration: death ? 0.45 : 0.12, level: death ? 0.1 : 0.05, filter: 'bandpass', frequency: 420 + kind * 160, pan: p })
      return
    }

    switch (effect) {
      case 'ali-slash':
        noise({ duration: 0.2, level: 0.16, filter: 'bandpass', frequency: 700 * v, to: 3_400, q: 1.2, pan: p })
        tone({ from: 190 * v, to: 85, duration: 0.18, level: 0.07, type: 'triangle', pan: p })
        tone({ from: 1_260 * v, to: 1_150, duration: 0.26, level: 0.025, type: 'sine', delay: 0.05, pan: p, vibrato: 6 })
        break
      case 'jack-slash':
        noise({ duration: 0.15, level: 0.15, filter: 'highpass', frequency: 2_200 * v, to: 6_500, pan: p })
        tone({ from: 2_350 * v, to: 1_900, duration: 0.2, level: 0.03, type: 'sine', delay: 0.03, pan: p })
        tone({ from: 3_520 * v, to: 3_300, duration: 0.14, level: 0.016, type: 'sine', delay: 0.035, pan: p })
        break
      case 'hit-impact':
        tone({ from: 150 * v, to: 55, duration: 0.13, level: 0.2, type: 'sine', pan: p, drive: 0.45 })
        noise({ duration: 0.09, level: 0.16, filter: 'lowpass', frequency: 2_400, to: 300, pan: p })
        tone({ from: 900, duration: 0.012, level: 0.06, type: 'square', pan: p, attack: 0.001 })
        break
      case 'kill-impact':
        tone({ from: 120 * v, to: 36, duration: 0.34, level: 0.27, type: 'sine', pan: p, drive: 0.75 })
        noise({ duration: 0.28, level: 0.18, filter: 'bandpass', frequency: 760, to: 240, pan: p })
        noise({ duration: 0.05, level: 0.12, filter: 'highpass', frequency: 3_000, pan: p })
        break
      case 'dash':
        noise({ duration: 0.2, level: 0.12, filter: 'bandpass', frequency: 500, to: 2_600, q: 1.1, pan: p })
        break
      case 'perfect-dodge':
        tone({ from: 1_320, to: 220, duration: 0.6, level: 0.09, type: 'sine', pan: p })
        tone({ from: 1_760, to: 1_760, duration: 0.7, level: 0.04, type: 'triangle', delay: 0.05, pan: p, vibrato: 18 })
        noise({ duration: 0.5, level: 0.05, filter: 'highpass', frequency: 5_000, pan: p, attack: 0.08 })
        audioEngine.duck('music', 0.55, 0.5)
        break
      case 'telegraph':
        tone({ from: 1_640, duration: 0.09, level: 0.022, type: 'sine', pan: p })
        tone({ from: 2_460, duration: 0.07, level: 0.014, type: 'sine', delay: 0.02, pan: p })
        break
      case 'ali-hurt':
        tone({ from: 270 * v, to: 150, duration: 0.24, level: 0.1, type: 'triangle', pan: p, filter: { type: 'bandpass', frequency: 800, q: 2 } })
        noise({ duration: 0.12, level: 0.06, filter: 'bandpass', frequency: 1_100, pan: p })
        break
      case 'jack-hurt':
        tone({ from: 210 * v, to: 120, duration: 0.26, level: 0.1, type: 'sawtooth', pan: p, filter: { type: 'bandpass', frequency: 950, q: 2.2 } })
        noise({ duration: 0.12, level: 0.05, filter: 'highpass', frequency: 1_500, pan: p })
        break
      case 'ali-down':
      case 'jack-down':
        tone({ from: effect === 'ali-down' ? 360 : 440, to: 60, duration: 0.9, level: 0.14, type: 'sawtooth', pan: p, filter: { type: 'lowpass', frequency: 1_200 } })
        taiko(0.2, p, 0.12)
        audioEngine.duck('music', 0.4, 0.9)
        break
      case 'ui-move':
        tone({ from: 1_180, duration: 0.05, level: 0.03, type: 'sine' })
        break
      case 'ui-confirm':
        tone({ from: 660, to: 880, duration: 0.1, level: 0.06, type: 'sine' })
        tone({ from: 990, to: 1_320, duration: 0.12, level: 0.04, type: 'triangle', delay: 0.05 })
        break
      case 'ui-back':
        tone({ from: 700, to: 460, duration: 0.1, level: 0.05, type: 'sine' })
        break
      case 'menu-hero-strike':
        noise({ duration: 0.42, level: 0.16, filter: 'highpass', frequency: 2_800 })
        tone({ from: 260, to: 1_240, duration: 0.46, level: 0.1, type: 'sawtooth', filter: { type: 'lowpass', frequency: 2_600 } })
        taiko(0.22, 0, 0.1)
        break
      case 'menu-enemy-strike':
        tone({ from: 118, to: 34, duration: 0.76, level: 0.2, type: 'square', filter: { type: 'lowpass', frequency: 700 }, drive: 0.4 })
        noise({ duration: 0.62, level: 0.16, filter: 'bandpass', frequency: 510 })
        break
      case 'defeat':
        tone({ from: 246, to: 33, duration: 1.6, level: 0.18, type: 'sawtooth', filter: { type: 'lowpass', frequency: 900 } })
        bell(110, 0.14, 0, 0.2, 4)
        break
      case 'shadow-hurt':
        tone({ from: 164 * v, to: 74, duration: 0.34, level: 0.12, type: 'sawtooth', pan: p, filter: { type: 'bandpass', frequency: 600 } })
        noise({ duration: 0.22, level: 0.08, filter: 'bandpass', frequency: 720, pan: p })
        break
      case 'shadow-roar':
      case 'aku-roar':
        tone({ from: effect === 'aku-roar' ? 74 : 92, to: effect === 'aku-roar' ? 146 : 38, duration: 1.1, level: 0.24, type: 'sawtooth', filter: { type: 'lowpass', frequency: 900 }, drive: 0.6 })
        tone({ from: 61, to: 31, duration: 1.2, level: 0.16, type: 'square', filter: { type: 'lowpass', frequency: 300 } })
        noise({ duration: 1.1, level: 0.16, filter: 'bandpass', frequency: 420, to: 900 })
        audioEngine.duck('music', 0.5, 1.2)
        break
      case 'shadow-death':
      case 'aku-death':
        tone({ from: 280, to: 21, duration: 1.8, level: 0.25, type: 'sawtooth', filter: { type: 'lowpass', frequency: 1_400 }, drive: 0.5 })
        noise({ duration: 1.6, level: 0.22, filter: 'lowpass', frequency: 1_600, to: 120 })
        bell(98, 0.18, 0, 0.3, 4.5)
        break
      case 'aku-hurt':
        tone({ from: 118 * v, to: 238, duration: 0.32, level: 0.12, type: 'square', pan: p, filter: { type: 'lowpass', frequency: 1_200 } })
        noise({ duration: 0.25, level: 0.08, filter: 'bandpass', frequency: 1_180, pan: p })
        break
      case 'fireball':
        noise({ duration: 0.4, level: 0.16, filter: 'bandpass', frequency: 900, to: 2_000, pan: p })
        tone({ from: 160, to: 620, duration: 0.34, level: 0.09, type: 'sawtooth', pan: p, filter: { type: 'lowpass', frequency: 1_800 } })
        break
      case 'shield':
        ;[523, 659, 784, 1_046].forEach((frequency, index) => tone({ from: frequency, duration: 0.9, level: 0.05, type: 'sine', delay: index * 0.05, pan: p, vibrato: 4 }))
        noise({ duration: 0.5, level: 0.05, filter: 'highpass', frequency: 4_000, pan: p, attack: 0.06 })
        break
      case 'heal':
        ;[660, 880, 1_320].forEach((frequency, index) => tone({ from: frequency, duration: 0.5, level: 0.05, type: 'sine', delay: index * 0.09, pan: p }))
        ;[0.05, 0.14, 0.22].forEach((delay) => tone({ from: 420 + Math.random() * 300, to: 900, duration: 0.07, level: 0.03, type: 'sine', delay, pan: p }))
        break
      case 'wave':
        taiko(0.26, 0)
        taiko(0.2, 0, 0.28)
        tone({ from: 82, to: 98, duration: 1.1, level: 0.08, type: 'sawtooth', delay: 0.1, filter: { type: 'lowpass', frequency: 520 } })
        break
      case 'biome-shift':
        bell(110, 0.16, 0, 0, 3.8)
        noise({ duration: 1.4, level: 0.04, filter: 'highpass', frequency: 5_500, attack: 0.3 })
        break
      case 'gate-open':
        noise({ duration: 1.3, level: 0.14, filter: 'lowpass', frequency: 320, pan: p, attack: 0.1 })
        tone({ from: 520, duration: 0.5, level: 0.05, type: 'triangle', delay: 0.4, pan: p })
        tone({ from: 780, duration: 0.7, level: 0.04, type: 'sine', delay: 0.55, pan: p })
        break
      case 'portal':
        tone({ from: 780, to: 42, duration: 1.2, level: 0.16, type: 'sine' })
        noise({ duration: 1.1, level: 0.12, filter: 'bandpass', frequency: 1_500, to: 300 })
        break
      case 'time-portal':
        tone({ from: 1_360, to: 86, duration: 0.7, level: 0.1, type: 'triangle', pan: p })
        tone({ from: 340, to: 1_020, duration: 0.6, level: 0.06, type: 'sine', delay: 0.06, pan: p, vibrato: 20 })
        noise({ duration: 0.6, level: 0.07, filter: 'bandpass', frequency: 2_200, pan: p })
        break
      case 'stone-throw':
        noise({ duration: 0.22, level: 0.14, filter: 'lowpass', frequency: 420, pan: p })
        tone({ from: 104, to: 62, duration: 0.22, level: 0.08, type: 'triangle', pan: p })
        break
      case 'dark-orb':
        tone({ from: 188, to: 620, duration: 0.5, level: 0.08, type: 'square', pan: p, filter: { type: 'lowpass', frequency: 1_400 } })
        tone({ from: 740, to: 124, duration: 0.5, level: 0.045, type: 'sine', delay: 0.04, pan: p })
        break
      case 'aku-fire':
        noise({ duration: 0.46, level: 0.16, filter: 'bandpass', frequency: 1_620, to: 700, pan: p })
        tone({ from: 96, to: 920, duration: 0.4, level: 0.09, type: 'sawtooth', pan: p, filter: { type: 'lowpass', frequency: 2_000 } })
        break
      case 'meteor-warning':
        tone({ from: 440, to: 330, duration: 0.3, level: 0.05, type: 'triangle', pan: p })
        noise({ duration: 0.5, level: 0.06, filter: 'lowpass', frequency: 260, pan: p })
        break
      case 'victory':
        ;[392, 523, 659, 784, 1_046].forEach((frequency, index) => tone({ from: frequency, to: frequency * 1.005, duration: 0.8, level: 0.08, type: 'triangle', delay: index * 0.12 }))
        bell(196, 0.12, 0, 0.6, 4)
        break
      case 'tide-warn':
        noise({ duration: 1.7, level: 0.16, filter: 'lowpass', frequency: 260, to: 2_200, pan: p, attack: 1.2 })
        break
      case 'lava-warn':
        tone({ from: 55, to: 48, duration: 1.1, level: 0.12, type: 'sine', pan: p, vibrato: 6 })
        noise({ duration: 1.1, level: 0.08, filter: 'lowpass', frequency: 380, pan: p, attack: 0.4 })
        break
      case 'gust-warn':
        noise({ duration: 2.2, level: 0.14, filter: 'bandpass', frequency: 380, to: 1_300, q: 3, pan: -0.4, attack: 0.9 })
        break
      case 'hazard-strike':
        noise({ duration: 0.7, level: 0.2, filter: 'lowpass', frequency: 1_400, to: 180, pan: p })
        tone({ from: 90, to: 38, duration: 0.6, level: 0.18, type: 'sine', pan: p, drive: 0.6 })
        break
      case 'neon-break':
        noise({ duration: 0.35, level: 0.16, filter: 'highpass', frequency: 4_200, pan: p })
        ;[3_100, 4_400, 5_200, 3_700].forEach((frequency, index) => tone({ from: frequency, duration: 0.18, level: 0.03, type: 'sine', delay: index * 0.03, pan: p }))
        tone({ from: 60, duration: 0.5, level: 0.1, type: 'square', pan: p, filter: { type: 'lowpass', frequency: 900 } })
        tone({ from: 120, to: 1_600, duration: 0.3, level: 0.06, type: 'sawtooth', delay: 0.05, pan: p, filter: { type: 'bandpass', frequency: 1_500 } })
        break
      case 'bell':
        bell(392, 0.1, p)
        break
      case 'resonance':
        bell(392, 0.12, -0.6)
        bell(392 * 1.498, 0.12, 0.6, 0.04)
        tone({ from: 98, duration: 3, level: 0.08, type: 'sawtooth', attack: 0.6, filter: { type: 'lowpass', frequency: 700 } })
        audioEngine.duck('music', 0.6, 1.8)
        break
      case 'firefly':
        ;[2_100, 2_640, 3_150, 2_800].forEach((frequency, index) => tone({ from: frequency, duration: 0.14, level: 0.025, type: 'sine', delay: index * 0.05, pan: p }))
        break
      case 'hourglass':
        // A reversed glass chime: the notes rise as time folds back.
        ;[1_320, 1_760, 2_090, 2_640].forEach((frequency, index) => tone({ from: frequency, duration: 0.9 - index * 0.12, level: 0.035, type: 'sine', delay: index * 0.06, pan: p, attack: 0.25 }))
        noise({ duration: 1.4, level: 0.06, filter: 'bandpass', frequency: 5_200, q: 1.5, pan: p, attack: 0.3 })
        tone({ from: 220, to: 110, duration: 1.6, level: 0.05, type: 'triangle', pan: p, attack: 0.4, vibrato: 3 })
        break
      case 'sand-burst':
        noise({ duration: 0.35, level: 0.1 * v, filter: 'bandpass', frequency: 3_400, to: 900, q: 0.8, pan: p })
        break
      case 'press-warn':
        noise({ duration: 1, level: 0.08, filter: 'highpass', frequency: 2_800, pan: p, attack: 0.5 })
        ;[0, 0.28, 0.56].forEach((delay) => tone({ from: 740, to: 700, duration: 0.18, level: 0.035, type: 'square', delay, pan: p, filter: { type: 'lowpass', frequency: 1_800 } }))
        break
      case 'press-slam':
        tone({ from: 70, to: 32, duration: 0.5, level: 0.24, type: 'sine', pan: p, drive: 0.8 })
        noise({ duration: 0.3, level: 0.18, filter: 'lowpass', frequency: 2_400, to: 300, pan: p })
        ;[1_900, 2_700, 3_600].forEach((frequency, index) => tone({ from: frequency * v, duration: 0.5, level: 0.02, type: 'triangle', delay: 0.02 + index * 0.01, pan: p }))
        audioEngine.duck('music', 0.75, 0.35)
        break
      case 'machine-break':
        ;[900, 1_400, 2_300, 3_100].forEach((frequency, index) => tone({ from: frequency * v, to: frequency * 0.5, duration: 0.16, level: 0.03, type: 'square', delay: index * 0.035, pan: p, filter: { type: 'bandpass', frequency: 1_800, q: 2 } }))
        noise({ duration: 0.25, level: 0.08, filter: 'highpass', frequency: 3_000, pan: p })
        break
      case 'rod-charge':
        tone({ from: 180, to: 1_800, duration: 0.6, level: 0.06, type: 'sawtooth', pan: p, filter: { type: 'bandpass', frequency: 1_400, q: 2 } })
        noise({ duration: 0.7, level: 0.08, filter: 'highpass', frequency: 5_000, pan: p })
        bell(880, 0.04, p, 0.35, 1.4)
        break
      case 'chain-zap':
        noise({ duration: 0.14, level: 0.09, filter: 'bandpass', frequency: 4_200 * v, q: 2, pan: p })
        tone({ from: 2_400 * v, to: 600, duration: 0.12, level: 0.03, type: 'sawtooth', pan: p })
        break
      case 'bolt-warn':
        noise({ duration: 1.2, level: 0.05, filter: 'bandpass', frequency: 900, to: 5_000, q: 3, pan: p, attack: 0.9 })
        break
      case 'thunder':
        noise({ duration: 0.12, level: 0.2, filter: 'highpass', frequency: 2_000, pan: p })
        noise({ duration: 2.4, level: 0.14, filter: 'lowpass', frequency: 300, to: 90, pan: p, delay: 0.06 })
        tone({ from: 55, to: 36, duration: 1.8, level: 0.12, type: 'sine', pan: p, delay: 0.05, drive: 0.5 })
        break
      case 'parry':
        // a bright ringing "ting" of steel meeting steel
        ;[2_637, 3_951, 5_274].forEach((frequency, index) => tone({ from: frequency * v, duration: 0.5 - index * 0.1, level: 0.05 - index * 0.012, type: 'sine', pan: p, attack: 0.002 }))
        noise({ duration: 0.08, level: 0.12, filter: 'highpass', frequency: 5_000, pan: p })
        break
      case 'finisher':
        noise({ duration: 0.34, level: 0.16, filter: 'bandpass', frequency: 700, to: 2_600, q: 1.2, pan: p, attack: 0.05 })
        tone({ from: 180 * v, to: 60, duration: 0.3, level: 0.08, type: 'sawtooth', pan: p, filter: { type: 'lowpass', frequency: 900 } })
        break
      case 'team-strike':
        taiko(0.22, -0.3)
        taiko(0.22, 0.3, 0.05)
        ;[1_318, 1_976].forEach((frequency, index) => tone({ from: frequency, duration: 0.9, level: 0.04, type: 'triangle', delay: 0.04 + index * 0.03 }))
        audioEngine.duck('music', 0.6, 0.6)
        break
      case 'sword-draw':
        noise({ duration: 0.28, level: 0.08, filter: 'bandpass', frequency: 4_200, to: 7_000, q: 3, pan: p })
        tone({ from: 3_300 * v, duration: 0.6, level: 0.022, type: 'sine', pan: p, delay: 0.12, vibrato: 7 })
        break
      case 'sword-sheathe':
        noise({ duration: 0.22, level: 0.06, filter: 'bandpass', frequency: 3_000, to: 1_400, q: 2, pan: p })
        tone({ from: 1_100, duration: 0.05, level: 0.06, type: 'square', pan: p, delay: 0.22, filter: { type: 'lowpass', frequency: 2_500 } })
        break
      case 'achievement':
        ;[523, 659, 784].forEach((frequency, index) => tone({ from: frequency, duration: 0.5, level: 0.06, type: 'triangle', delay: index * 0.08 }))
        tone({ from: 1_568, duration: 0.8, level: 0.03, type: 'sine', delay: 0.26, vibrato: 5 })
        break
    }
  }
}

export const gameAudio = new GameAudio()
