export class PetAudio {
  private ctx: AudioContext | null = null
  muted = false

  setMuted(muted: boolean): void {
    this.muted = muted
  }

  private context(): AudioContext | null {
    if (this.muted) return null
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctor()
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  meow(): void {
    const ctx = this.context()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1200
    filter.Q.value = 1.2
    osc.type = 'triangle'
    osc2.type = 'sawtooth'
    osc.frequency.setValueAtTime(820, now)
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.16)
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.28)
    osc2.frequency.setValueAtTime(410, now)
    osc2.frequency.exponentialRampToValueAtTime(210, now + 0.28)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32)
    osc.connect(filter)
    osc2.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc2.start(now)
    osc.stop(now + 0.34)
    osc2.stop(now + 0.34)
  }

  purr(): void {
    const ctx = this.context()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(48, now)
    osc.frequency.setValueAtTime(56, now + 0.08)
    osc.frequency.setValueAtTime(44, now + 0.16)
    osc.frequency.setValueAtTime(58, now + 0.24)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.42)
  }

  chomp(): void {
    const ctx = this.context()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.08)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.12)
  }
}
