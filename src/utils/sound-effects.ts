/**
 * سیستم صوتی اختصاصی با Web Audio API
 * بدون نیاز به فایل‌های صوتی خارجی، کاملاً مستقل و با بالاترین سرعت
 */

class SoundEffectsManager {
  private ctx: AudioContext | null = null
  public enabled = true

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        this.ctx = new AudioContextClass()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  // صدای پاسخ صحیح (Chime دلنشین)
  playCorrect(): void {
    if (!this.enabled) return
    const ctx = this.initCtx()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.08)

      gain.gain.setValueAtTime(0, now + idx * 0.08)
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + idx * 0.08)
      osc.stop(now + idx * 0.08 + 0.35)
    })
  }

  // صدای پاسخ غلط (Buzz آرام)
  playIncorrect(): void {
    if (!this.enabled) return
    const ctx = this.initCtx()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(160, now)
    osc.frequency.linearRampToValueAtTime(110, now + 0.3)

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.3)
  }

  // صدای پرتاب موشک
  playLaunch(): void {
    if (!this.enabled) return
    const ctx = this.initCtx()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.4)

    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.5)
  }

  // صدای اصابت و انفجار
  playExplosion(): void {
    if (!this.enabled) return
    const ctx = this.initCtx()
    if (!ctx) return

    const now = ctx.currentTime
    // تولید نویز سفید برای انفجار
    const bufferSize = ctx.sampleRate * 0.5
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(800, now)
    filter.frequency.exponentialRampToValueAtTime(50, now + 0.5)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.4, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start(now)
    noise.stop(now + 0.5)
  }

  // صدای پیروزی مرحله
  playVictory(): void {
    if (!this.enabled) return
    const ctx = this.initCtx()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [440, 554.37, 659.25, 880] // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + idx * 0.12)

      gain.gain.setValueAtTime(0.2, now + idx * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + idx * 0.12)
      osc.stop(now + idx * 0.12 + 0.4)
    })
  }
}

export const sfx = new SoundEffectsManager()
