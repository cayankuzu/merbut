import { audioEngine } from './audioEngine'
import { THEMES, type LeadVoice, type MusicTheme, type PadVoice, type ThemeId } from './musicThemes'

/**
 * A lookahead step sequencer (the "two clocks" pattern): a light timer asks
 * every 25 ms which 16th notes fall in the next 120 ms and schedules them on
 * the audio clock, so timing never depends on the render loop.
 */
const LOOKAHEAD_S = 0.12
const TICK_MS = 25

const midiToHz = (note: number) => 440 * 2 ** ((note - 69) / 12)

interface Layers {
  output: GainNode
  pad: GainNode
  lead: GainNode
  bass: GainNode
  drums: GainNode
}

class MusicEngine {
  private theme: MusicTheme | null = null
  private themeId: ThemeId | null = null
  private layers: Layers | null = null
  private timer: number | null = null
  private step = 0
  private nextStepTime = 0
  private intensity = 0

  get current() {
    return this.themeId
  }

  play(id: ThemeId) {
    if (id === this.themeId) return
    const context = audioEngine.resume()
    const bus = audioEngine.bus('music')
    if (!context || !bus) return
    const previous = this.layers
    if (previous) {
      previous.output.gain.cancelScheduledValues(context.currentTime)
      previous.output.gain.setTargetAtTime(0.0001, context.currentTime, 0.45)
      window.setTimeout(() => previous.output.disconnect(), 2_500)
    }
    const output = context.createGain()
    output.gain.value = 0.0001
    output.gain.setTargetAtTime(1, context.currentTime + 0.1, 0.6)
    output.connect(bus)
    const layer = () => {
      const gain = context.createGain()
      gain.connect(output)
      return gain
    }
    this.layers = { output, pad: layer(), lead: layer(), bass: layer(), drums: layer() }
    this.theme = THEMES[id]
    this.themeId = id
    this.step = 0
    this.nextStepTime = context.currentTime + 0.15
    this.applyIntensity(true)
    if (this.timer === null) this.timer = window.setInterval(() => this.schedule(), TICK_MS)
  }

  stop() {
    const context = audioEngine.context
    if (this.layers && context) this.layers.output.gain.setTargetAtTime(0.0001, context.currentTime, 0.5)
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
    this.themeId = null
    this.theme = null
  }

  /** 0 = exploring, 1 = full combat. Drums and bass follow it smoothly. */
  setIntensity(value: number) {
    const next = Math.max(0, Math.min(1, value))
    if (Math.abs(next - this.intensity) < 0.02) return
    this.intensity = next
    this.applyIntensity(false)
  }

  private applyIntensity(immediate: boolean) {
    const context = audioEngine.context
    if (!context || !this.layers || !this.theme) return
    const drums = Math.max(this.theme.calmDrums, this.intensity)
    const time = context.currentTime
    const set = (gain: GainNode, value: number) => immediate ? gain.gain.setValueAtTime(value, time) : gain.gain.setTargetAtTime(value, time, 0.8)
    set(this.layers.drums, 0.2 + drums * 0.8)
    set(this.layers.bass, 0.55 + this.intensity * 0.45)
    set(this.layers.pad, 0.8 - this.intensity * 0.25)
    set(this.layers.lead, 0.8)
  }

  private schedule() {
    const context = audioEngine.context
    if (!context || !this.theme || !this.layers || context.state !== 'running') return
    const secondsPerStep = 60 / this.theme.tempo / 4
    while (this.nextStepTime < context.currentTime + LOOKAHEAD_S) {
      this.playStep(this.step, this.nextStepTime, secondsPerStep)
      this.nextStepTime += secondsPerStep
      this.step += 1
    }
  }

  private note(degree: number, octave: number) {
    const theme = this.theme!
    const scale = theme.scale
    const wrapped = ((degree % scale.length) + scale.length) % scale.length
    const octaveShift = Math.floor(degree / scale.length)
    return theme.root + 12 * (octave + octaveShift) + scale[wrapped]!
  }

  private playStep(step: number, time: number, stepLength: number) {
    const theme = this.theme!
    const layers = this.layers!
    const inBar = step % 16
    const block = Math.floor(step / 32) % theme.progression.length
    const chordRoot = theme.progression[block]!
    if (step % 32 === 0) this.pad(layers.pad, theme.pad, [this.note(chordRoot, 1), this.note(chordRoot + 2, 1), this.note(chordRoot + 4, 1)], time, stepLength * 32, theme.brightness)
    if (theme.bass[inBar] === 'x') this.bass(layers.bass, midiToHz(this.note(chordRoot, 0)), time, stepLength * 3)
    if (theme.kick[inBar] === 'x') this.drum(layers.drums, 'kick', time)
    if (theme.tom[inBar] === 'x') this.drum(layers.drums, 'tom', time)
    if (theme.hat[inBar] === 'x') this.drum(layers.drums, 'hat', time)
    // The motif alternates with a breathing space so it never becomes a loop you notice.
    const cycle = Math.floor(step / 32)
    const degree = theme.motif[step % 32]
    if (degree !== null && degree !== undefined && (cycle % 2 === 0 || this.intensity > 0.5)) {
      let length = 1
      while (length < 8 && theme.motif[(step + length) % 32] === null) length += 1
      this.lead(layers.lead, theme.lead, midiToHz(this.note(degree, 2)), time, stepLength * length)
    }
  }

  private pad(output: GainNode, voice: PadVoice, notes: number[], time: number, duration: number, brightness: number) {
    const context = audioEngine.context!
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = voice === 'glass' ? brightness * 2.2 : voice === 'dark' ? brightness * 0.55 : brightness
    filter.Q.value = voice === 'choir' ? 4 : 0.7
    const gain = context.createGain()
    const level = voice === 'glass' ? 0.035 : 0.05
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.linearRampToValueAtTime(level, time + Math.min(1.4, duration * 0.3))
    gain.gain.setValueAtTime(level, time + duration * 0.8)
    gain.gain.linearRampToValueAtTime(0.0001, time + duration + 0.6)
    filter.connect(gain).connect(output)
    const types: OscillatorType[] = voice === 'glass' ? ['sine', 'triangle'] : voice === 'dark' ? ['square', 'sawtooth'] : ['sawtooth', 'sawtooth']
    notes.forEach((note, index) => {
      types.forEach((type, voiceIndex) => {
        const oscillator = context.createOscillator()
        oscillator.type = type
        oscillator.frequency.value = midiToHz(note + (voice === 'glass' ? 12 : 0))
        oscillator.detune.value = (voiceIndex === 0 ? -7 : 7) + index * 2
        oscillator.connect(filter)
        oscillator.start(time)
        oscillator.stop(time + duration + 0.7)
      })
    })
  }

  private bass(output: GainNode, frequency: number, time: number, duration: number) {
    const context = audioEngine.context!
    const oscillator = context.createOscillator()
    oscillator.type = 'triangle'
    oscillator.frequency.value = frequency
    const sub = context.createOscillator()
    sub.type = 'sine'
    sub.frequency.value = frequency / 2
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 520
    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.16, time + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)
    oscillator.connect(filter)
    sub.connect(filter)
    filter.connect(gain).connect(output)
    oscillator.start(time)
    sub.start(time)
    oscillator.stop(time + duration + 0.05)
    sub.stop(time + duration + 0.05)
  }

  private drum(output: GainNode, kind: 'kick' | 'tom' | 'hat', time: number) {
    const context = audioEngine.context!
    const gain = context.createGain()
    gain.connect(output)
    if (kind === 'hat') {
      const buffer = audioEngine.noiseBuffer()
      if (!buffer) return
      const source = context.createBufferSource()
      source.buffer = buffer
      const filter = context.createBiquadFilter()
      filter.type = 'highpass'
      filter.frequency.value = 6_500
      gain.gain.setValueAtTime(0.045, time)
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06)
      source.connect(filter).connect(gain)
      source.start(time, Math.random())
      source.stop(time + 0.08)
      return
    }
    const oscillator = context.createOscillator()
    oscillator.type = 'sine'
    const [from, to, length, level] = kind === 'kick' ? [130, 42, 0.42, 0.34] : [210, 95, 0.28, 0.18]
    oscillator.frequency.setValueAtTime(from, time)
    oscillator.frequency.exponentialRampToValueAtTime(to, time + length * 0.8)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(level, time + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length)
    oscillator.connect(gain)
    oscillator.start(time)
    oscillator.stop(time + length + 0.05)
  }

  private lead(output: GainNode, voice: LeadVoice, frequency: number, time: number, duration: number) {
    const context = audioEngine.context!
    const length = Math.min(2.4, Math.max(0.18, duration))
    const gain = context.createGain()
    const filter = context.createBiquadFilter()
    filter.type = voice === 'synth' ? 'lowpass' : 'bandpass'
    filter.frequency.value = voice === 'ney' ? frequency * 2 : voice === 'shakuhachi' ? frequency * 2.4 : voice === 'koto' ? frequency * 3 : 2_200
    filter.Q.value = voice === 'synth' ? 3 : 0.9
    filter.connect(gain).connect(output)
    const oscillator = context.createOscillator()
    oscillator.type = voice === 'koto' ? 'triangle' : voice === 'synth' ? 'sawtooth' : 'sine'
    oscillator.frequency.setValueAtTime(frequency * (voice === 'ney' || voice === 'shakuhachi' ? 0.985 : 1), time)
    oscillator.frequency.linearRampToValueAtTime(frequency, time + 0.08)
    if (voice !== 'koto') {
      const vibrato = context.createOscillator()
      const depth = context.createGain()
      vibrato.frequency.value = voice === 'ney' ? 5.4 : 4.6
      depth.gain.setValueAtTime(0, time)
      depth.gain.linearRampToValueAtTime(frequency * 0.012, time + length * 0.6)
      vibrato.connect(depth).connect(oscillator.frequency)
      vibrato.start(time)
      vibrato.stop(time + length + 0.1)
    }
    oscillator.connect(filter)
    const level = voice === 'koto' ? 0.07 : voice === 'synth' ? 0.035 : 0.055
    gain.gain.setValueAtTime(0.0001, time)
    if (voice === 'koto') {
      gain.gain.exponentialRampToValueAtTime(level, time + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, time + Math.min(1.2, length + 0.4))
    } else {
      gain.gain.linearRampToValueAtTime(level, time + 0.09)
      gain.gain.setValueAtTime(level, time + length * 0.75)
      gain.gain.linearRampToValueAtTime(0.0001, time + length + 0.25)
    }
    oscillator.start(time)
    oscillator.stop(time + length + 0.4)
    // Breath noise at the attack gives the flutes their air.
    if (voice === 'ney' || voice === 'shakuhachi') {
      const buffer = audioEngine.noiseBuffer()
      if (!buffer) return
      const breath = context.createBufferSource()
      breath.buffer = buffer
      const breathFilter = context.createBiquadFilter()
      breathFilter.type = 'bandpass'
      breathFilter.frequency.value = frequency * 3
      breathFilter.Q.value = 1.2
      const breathGain = context.createGain()
      breathGain.gain.setValueAtTime(0.0001, time)
      breathGain.gain.linearRampToValueAtTime(0.018, time + 0.05)
      breathGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35)
      breath.connect(breathFilter).connect(breathGain).connect(output)
      breath.start(time, Math.random())
      breath.stop(time + 0.4)
    }
  }
}

export const musicEngine = new MusicEngine()
