import { BIOMES, type BiomeId } from '../config/biomes'
import { audioEngine, noise, tone } from './audioEngine'

/**
 * A living sound bed per biome: one filtered noise loop plus sparse, random
 * "events" (gulls, frogs, sirens, chimes, crackles). All synthesised.
 */
interface AmbienceStyle {
  bed: { filter: BiquadFilterType; frequency: number; q: number; level: number; swell: number }
  events: { every: [number, number]; play: (pan: number) => void }[]
}

const random = (minimum: number, maximum: number) => minimum + Math.random() * (maximum - minimum)
const opts = { bus: 'ambience' as const }

const STYLES: Record<BiomeId, AmbienceStyle> = {
  'aku-city': { // Aku Metropolü: machine hum, distant sirens, spark crackle
    bed: { filter: 'lowpass', frequency: 190, q: 0.8, level: 0.09, swell: 0.1 },
    events: [
      { every: [11, 19], play: (pan) => tone({ ...opts, from: 620, to: 880, duration: 2.6, level: 0.018, type: 'sine', pan, vibrato: 30, attack: 0.8 }) },
      { every: [4, 9], play: (pan) => noise({ ...opts, duration: 0.08, level: 0.03, filter: 'highpass', frequency: 5_000, pan }) },
    ],
  },
  'sunset-harbor': { // Günbatımı Limanı: surf, gulls, creaking rope
    bed: { filter: 'lowpass', frequency: 520, q: 0.6, level: 0.1, swell: 0.6 },
    events: [
      { every: [5, 11], play: (pan) => [0, 0.14, 0.3].forEach((delay) => tone({ ...opts, from: random(1_900, 2_300), to: random(1_500, 1_800), duration: 0.18, level: 0.012, type: 'triangle', pan, delay })) },
      { every: [7, 13], play: (pan) => tone({ ...opts, from: 95, to: 80, duration: 0.6, level: 0.02, type: 'sawtooth', pan, filter: { type: 'bandpass', frequency: 400, q: 3 } }) },
    ],
  },
  'hourglass-desert': { // Kum Saati Çölü: hissing sand, a distant ticking clock, a lonely bell
    bed: { filter: 'highpass', frequency: 2_600, q: 0.5, level: 0.05, swell: 0.7 },
    events: [
      { every: [6, 11], play: (pan) => [0, 0.5, 1, 1.5].forEach((delay) => tone({ ...opts, from: 1_900, duration: 0.03, level: 0.012, type: 'square', pan, delay })) },
      { every: [12, 20], play: (pan) => tone({ ...opts, from: 520, duration: 2.2, level: 0.012, type: 'sine', pan, vibrato: 4 }) },
    ],
  },
  'golden-swamp': { // Altın Bataklık: insects, frogs, drips
    bed: { filter: 'bandpass', frequency: 4_600, q: 2.5, level: 0.035, swell: 0.3 },
    events: [
      { every: [2, 5], play: (pan) => [0, 0.16].forEach((delay) => tone({ ...opts, from: random(160, 220), to: 120, duration: 0.12, level: 0.03, type: 'square', pan, delay, filter: { type: 'lowpass', frequency: 700 } })) },
      { every: [3, 7], play: (pan) => tone({ ...opts, from: random(900, 1_400), to: 400, duration: 0.09, level: 0.02, type: 'sine', pan }) },
    ],
  },
  'beetle-foundry': { // Böcek Dökümhanesi: machine hum, hammer clanks, steam hiss
    bed: { filter: 'lowpass', frequency: 160, q: 1.2, level: 0.12, swell: 0.15 },
    events: [
      { every: [1.2, 2.6], play: (pan) => tone({ ...opts, from: random(260, 340), to: 180, duration: 0.12, level: 0.03, type: 'square', pan, filter: { type: 'bandpass', frequency: 900, q: 4 } }) },
      { every: [5, 9], play: (pan) => noise({ ...opts, duration: 0.9, level: 0.025, filter: 'highpass', frequency: 3_600, pan }) },
    ],
  },
  'skull-island': { // Kafatası Adası: lava rumble, bubbling
    bed: { filter: 'lowpass', frequency: 130, q: 1, level: 0.12, swell: 0.25 },
    events: [
      { every: [1.5, 4], play: (pan) => tone({ ...opts, from: random(200, 480), to: random(90, 160), duration: 0.14, level: 0.025, type: 'sine', pan }) },
    ],
  },
  'jade-ruins': { // Yeşim Harabeleri: soft wind, wind chimes
    bed: { filter: 'bandpass', frequency: 650, q: 0.9, level: 0.06, swell: 0.5 },
    events: [
      { every: [4, 9], play: (pan) => [0, 0.2, 0.45].forEach((delay) => tone({ ...opts, from: random(1_300, 2_600), duration: 1.4, level: 0.01, type: 'sine', pan, delay })) },
    ],
  },
  'storm-peak': { // Şimşek Zirvesi: rain on stone, rolling thunder, flags snapping
    bed: { filter: 'bandpass', frequency: 1_800, q: 0.6, level: 0.08, swell: 0.4 },
    events: [
      { every: [7, 13], play: (pan) => noise({ ...opts, duration: 2.4, level: 0.05, filter: 'lowpass', frequency: 180, pan, attack: 0.05 }) },
      { every: [3, 6], play: (pan) => noise({ ...opts, duration: 0.06, level: 0.02, filter: 'bandpass', frequency: 1_400, pan }) },
    ],
  },
  'skull-field': { // Sessiz Kemik Ovası: howling wind, bone rattle
    bed: { filter: 'bandpass', frequency: 420, q: 3.5, level: 0.07, swell: 0.8 },
    events: [
      { every: [8, 15], play: (pan) => [0, 0.06, 0.12, 0.2].forEach((delay) => noise({ ...opts, duration: 0.03, level: 0.03, filter: 'bandpass', frequency: 2_400, pan, delay })) },
    ],
  },
  'inferno-throne': { // Alev Tahtı: fire roar, crackle
    bed: { filter: 'lowpass', frequency: 420, q: 0.7, level: 0.11, swell: 0.3 },
    events: [
      { every: [0.4, 1.6], play: (pan) => noise({ ...opts, duration: 0.04, level: 0.035, filter: 'highpass', frequency: 2_800, pan }) },
    ],
  },
}

class Ambience {
  private biome = -1
  private bed: { source: AudioBufferSourceNode; gain: GainNode; lfo: OscillatorNode } | null = null
  private timers: number[] = []

  play(biome: number) {
    if (biome === this.biome) return
    this.stop()
    const context = audioEngine.resume()
    const bus = audioEngine.bus('ambience')
    const buffer = audioEngine.noiseBuffer()
    const id = BIOMES[biome]?.id
    const style = id ? STYLES[id] : undefined
    if (!context || !bus || !buffer || !style) return
    this.biome = biome
    const source = context.createBufferSource()
    source.buffer = buffer
    source.loop = true
    const filter = context.createBiquadFilter()
    filter.type = style.bed.filter
    filter.frequency.value = style.bed.frequency
    filter.Q.value = style.bed.q
    const gain = context.createGain()
    gain.gain.value = 0.0001
    gain.gain.setTargetAtTime(style.bed.level, context.currentTime, 1.2)
    // A slow swell makes the bed breathe (surf, wind gusts, fire).
    const lfo = context.createOscillator()
    const depth = context.createGain()
    lfo.frequency.value = 0.12
    depth.gain.value = style.bed.level * style.bed.swell
    lfo.connect(depth).connect(gain.gain)
    source.connect(filter).connect(gain).connect(bus)
    source.start()
    lfo.start()
    this.bed = { source, gain, lfo }
    style.events.forEach((event) => this.loop(event.every, event.play))
  }

  private loop(every: [number, number], play: (pan: number) => void) {
    const schedule = () => {
      const timer = window.setTimeout(() => {
        if (audioEngine.context?.state === 'running') play(random(-0.8, 0.8))
        schedule()
      }, random(every[0], every[1]) * 1_000)
      this.timers.push(timer)
    }
    schedule()
  }

  stop() {
    this.timers.forEach((timer) => window.clearTimeout(timer))
    this.timers = []
    const context = audioEngine.context
    if (this.bed && context) {
      const { source, gain, lfo } = this.bed
      gain.gain.setTargetAtTime(0.0001, context.currentTime, 0.6)
      window.setTimeout(() => {
        source.stop()
        lfo.stop()
      }, 2_500)
    }
    this.bed = null
    this.biome = -1
  }
}

export const ambience = new Ambience()

/** Dialogue "voice": a soft syllable blip per few letters, tuned per speaker. */
let lastBlip = 0
export function voiceBlip(pitch: number) {
  if (pitch <= 0 || !audioEngine.context) return
  const now = performance.now()
  if (now - lastBlip < 55) return
  lastBlip = now
  const frequency = pitch * (0.9 + Math.random() * 0.25)
  tone({ bus: 'voice', from: frequency, to: frequency * 0.92, duration: 0.07, level: 0.05, type: 'triangle', filter: { type: 'bandpass', frequency: frequency * 3, q: 1.4 } })
}
