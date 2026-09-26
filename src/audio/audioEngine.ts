/**
 * One shared Web Audio graph for the whole game:
 *
 *   sfx ─┐                      ┌─ reverb (convolver) ─┐
 *   music┼─ bus gains ─ sends ──┤                      ├─ master ─ limiter ─ out
 *   amb ─┤                      └──────── dry ─────────┘
 *   voice┘
 *
 * Everything is synthesised at runtime, so the game ships no audio files and
 * owes no licences for its sound.
 */
export type AudioBus = 'sfx' | 'music' | 'ambience' | 'voice'

const REVERB_SEND: Record<AudioBus, number> = { sfx: 0.16, music: 0.22, ambience: 0.3, voice: 0.08 }

class AudioEngine {
  context: AudioContext | null = null
  private master: GainNode | null = null
  private buses = new Map<AudioBus, GainNode>()
  private noise: AudioBuffer | null = null
  private levels: Record<AudioBus | 'master', number> = { master: 0.9, sfx: 0.78, music: 0.5, ambience: 0.55, voice: 0.7 }

  get ready() {
    return this.context !== null
  }

  ensure() {
    if (this.context || typeof window === 'undefined') return this.context
    const Constructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Constructor) return null
    const context = new Constructor({ latencyHint: 'interactive' })
    const master = context.createGain()
    master.gain.value = this.levels.master
    const limiter = context.createDynamicsCompressor()
    limiter.threshold.value = -9
    limiter.knee.value = 10
    limiter.ratio.value = 8
    limiter.attack.value = 0.002
    limiter.release.value = 0.14
    master.connect(limiter).connect(context.destination)

    const reverb = context.createConvolver()
    reverb.buffer = this.impulse(context, 2.4, 2.6)
    const reverbInput = context.createGain()
    reverbInput.gain.value = 1
    const reverbReturn = context.createGain()
    reverbReturn.gain.value = 0.55
    reverbInput.connect(reverb).connect(reverbReturn).connect(master)

    for (const bus of ['sfx', 'music', 'ambience', 'voice'] as const) {
      const gain = context.createGain()
      gain.gain.value = this.levels[bus]
      gain.connect(master)
      const send = context.createGain()
      send.gain.value = REVERB_SEND[bus]
      gain.connect(send).connect(reverbInput)
      this.buses.set(bus, gain)
    }
    this.context = context
    this.master = master
    return context
  }

  resume() {
    const context = this.ensure()
    if (context?.state === 'suspended') void context.resume()
    return context
  }

  suspend() {
    if (this.context?.state === 'running') void this.context.suspend()
  }

  setLevel(bus: AudioBus | 'master', value: number) {
    this.levels[bus] = Math.max(0, Math.min(1, value))
    const node = bus === 'master' ? this.master : this.buses.get(bus)
    if (node && this.context) node.gain.setTargetAtTime(this.levels[bus], this.context.currentTime, 0.03)
  }

  level(bus: AudioBus | 'master') {
    return this.levels[bus]
  }

  /** Briefly lowers a bus (music ducks under big hits and dialogue). */
  duck(bus: AudioBus, amount: number, seconds: number) {
    const node = this.buses.get(bus)
    if (!node || !this.context) return
    const now = this.context.currentTime
    node.gain.cancelScheduledValues(now)
    node.gain.setTargetAtTime(this.levels[bus] * (1 - amount), now, 0.02)
    node.gain.setTargetAtTime(this.levels[bus], now + seconds, 0.25)
  }

  bus(bus: AudioBus) {
    this.ensure()
    return this.buses.get(bus) ?? null
  }

  noiseBuffer() {
    const context = this.ensure()
    if (!context) return null
    if (this.noise) return this.noise
    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1
    this.noise = buffer
    return buffer
  }

  private impulse(context: AudioContext, seconds: number, decay: number) {
    const length = Math.floor(context.sampleRate * seconds)
    const buffer = context.createBuffer(2, length, context.sampleRate)
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel)
      for (let index = 0; index < length; index += 1) {
        data[index] = (Math.random() * 2 - 1) * (1 - index / length) ** decay
      }
    }
    return buffer
  }
}

export const audioEngine = new AudioEngine()

/** Small helpers shared by the SFX, music and voice synthesisers. */
export interface ToneOptions {
  from: number
  to?: number
  duration: number
  level: number
  type?: OscillatorType
  delay?: number
  attack?: number
  pan?: number
  bus?: AudioBus
  detune?: number
  vibrato?: number
  filter?: { type: BiquadFilterType; frequency: number; q?: number }
  drive?: number
}

const driveCurves = new Map<number, Float32Array<ArrayBuffer>>()
function driveCurve(amount: number) {
  const cached = driveCurves.get(amount)
  if (cached) return cached
  const curve = new Float32Array(1024)
  for (let index = 0; index < curve.length; index += 1) {
    const x = (index / (curve.length - 1)) * 2 - 1
    curve[index] = Math.tanh(x * (1 + amount * 6))
  }
  driveCurves.set(amount, curve)
  return curve
}

function output(context: AudioContext, bus: AudioBus, pan: number) {
  const destination = audioEngine.bus(bus)
  if (!destination) return null
  if (pan === 0 || !('createStereoPanner' in context)) return destination
  const panner = context.createStereoPanner()
  panner.pan.value = Math.max(-1, Math.min(1, pan))
  panner.connect(destination)
  return panner
}

export function tone(options: ToneOptions) {
  const context = audioEngine.context
  if (!context) return
  const start = context.currentTime + (options.delay ?? 0)
  const end = start + options.duration
  const oscillator = context.createOscillator()
  oscillator.type = options.type ?? 'sine'
  oscillator.frequency.setValueAtTime(Math.max(1, options.from), start)
  if (options.to !== undefined && options.to !== options.from) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, options.to), end)
  if (options.detune) oscillator.detune.value = options.detune
  if (options.vibrato) {
    const lfo = context.createOscillator()
    const depth = context.createGain()
    lfo.frequency.value = 5.2
    depth.gain.value = options.vibrato
    lfo.connect(depth).connect(oscillator.frequency)
    lfo.start(start)
    lfo.stop(end + 0.05)
  }
  const gain = context.createGain()
  const attack = Math.max(0.002, options.attack ?? 0.012)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, options.level), start + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, end)
  let node: AudioNode = oscillator
  if (options.filter) {
    const filter = context.createBiquadFilter()
    filter.type = options.filter.type
    filter.frequency.value = options.filter.frequency
    filter.Q.value = options.filter.q ?? 0.8
    node.connect(filter)
    node = filter
  }
  if (options.drive) {
    const shaper = context.createWaveShaper()
    shaper.curve = driveCurve(options.drive)
    node.connect(shaper)
    node = shaper
  }
  const destination = output(context, options.bus ?? 'sfx', options.pan ?? 0)
  if (!destination) return
  node.connect(gain).connect(destination)
  oscillator.start(start)
  oscillator.stop(end + 0.05)
}

export interface NoiseOptions {
  duration: number
  level: number
  filter: BiquadFilterType
  frequency: number
  to?: number
  q?: number
  delay?: number
  attack?: number
  pan?: number
  bus?: AudioBus
}

export function noise(options: NoiseOptions) {
  const context = audioEngine.context
  const buffer = audioEngine.noiseBuffer()
  if (!context || !buffer) return
  const start = context.currentTime + (options.delay ?? 0)
  const end = start + options.duration
  const source = context.createBufferSource()
  source.buffer = buffer
  source.loop = options.duration > 1.9
  source.playbackRate.value = 0.8 + Math.random() * 0.4
  const filter = context.createBiquadFilter()
  filter.type = options.filter
  filter.frequency.setValueAtTime(options.frequency, start)
  if (options.to) filter.frequency.exponentialRampToValueAtTime(Math.max(20, options.to), end)
  filter.Q.value = options.q ?? (options.filter === 'bandpass' ? 1.6 : 0.7)
  const gain = context.createGain()
  const attack = Math.max(0.002, options.attack ?? 0.004)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, options.level), start + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, end)
  const destination = output(context, options.bus ?? 'sfx', options.pan ?? 0)
  if (!destination) return
  source.connect(filter).connect(gain).connect(destination)
  source.start(start, source.loop ? Math.random() : Math.random() * Math.max(0, 1.9 - options.duration))
  source.stop(end + 0.05)
}
