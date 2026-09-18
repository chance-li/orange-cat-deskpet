import type { AnimState } from '../../../shared/constants'
import { CLIPS, DEFAULT_FRAME, preloadClips, type ClipDef } from './clips'

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export class SpriteAnimator {
  private readonly bufs: [HTMLImageElement, HTMLImageElement]
  private front = 0
  private clip: ClipDef = CLIPS.idle
  private index = 0
  private dir = 1
  private nextAt = 0
  private lastUrl = ''
  private pending: string | null = null
  private swapping = false
  private blinkPhase: 'hold' | 'closing-half' | 'closed' | 'opening-half' = 'hold'
  private readyPromise: Promise<void>

  constructor(container: HTMLElement) {
    const a = container.querySelector('.sprite-a') as HTMLImageElement
    const b = container.querySelector('.sprite-b') as HTMLImageElement
    this.bufs = [a, b]
    a.src = DEFAULT_FRAME
    a.classList.add('is-visible')
    this.lastUrl = DEFAULT_FRAME
    this.readyPromise = preloadClips()
  }

  ready(): Promise<void> {
    return this.readyPromise
  }

  play(state: AnimState): void {
    this.clip = CLIPS[state]
    this.index = 0
    this.dir = 1
    this.blinkPhase = 'hold'
    this.show(0)
    const now = performance.now()
    this.nextAt = now + (this.clip.mode === 'idle-blink' ? this.holdDelay() : this.duration(0))
  }

  tick(now: number): void {
    if (now < this.nextAt) return
    if (this.clip.mode === 'idle-blink') {
      this.tickBlink(now)
      return
    }

    const count = this.clip.frames.length
    if (count <= 1) {
      this.nextAt = now + 1000
      return
    }

    if (this.clip.mode === 'loop') {
      this.index = (this.index + 1) % count
    } else if (this.clip.mode === 'pingpong') {
      const next = this.index + this.dir
      if (next < 0 || next >= count) {
        this.dir *= -1
        this.index += this.dir
      } else {
        this.index = next
      }
    } else {
      if (this.index >= count - 1) {
        this.nextAt = now + 60_000
        return
      }
      this.index += 1
    }

    this.show(this.index)
    this.nextAt = now + this.duration(this.index)
  }

  private tickBlink(now: number): void {
    switch (this.blinkPhase) {
      case 'hold':
        this.blinkPhase = 'closing-half'
        this.show(1)
        this.nextAt = now + 60
        break
      case 'closing-half':
        this.blinkPhase = 'closed'
        this.show(2)
        this.nextAt = now + 80
        break
      case 'closed':
        this.blinkPhase = 'opening-half'
        this.show(1)
        this.nextAt = now + 60
        break
      case 'opening-half':
        this.blinkPhase = 'hold'
        this.show(0)
        this.nextAt = now + this.holdDelay()
        break
    }
  }

  private holdDelay(): number {
    return rand(2400, 5600)
  }

  private duration(index: number): number {
    const ms = this.clip.frameMs
    return Array.isArray(ms) ? ms[Math.min(index, ms.length - 1)] : ms
  }

  private show(index: number): void {
    const url = this.clip.frames[index]
    if (!url) return
    void this.swap(url)
  }

  private async swap(url: string): Promise<void> {
    if (url === this.lastUrl) return
    this.pending = url
    if (this.swapping) return
    this.swapping = true
    while (this.pending) {
      const next = this.pending
      this.pending = null
      const back = 1 - this.front
      const incoming = this.bufs[back]
      const outgoing = this.bufs[this.front]
      if (incoming.getAttribute('src') !== next) incoming.src = next
      try {
        await incoming.decode()
      } catch {
        /* keep the visible frame if decode fails */
        continue
      }
      if (this.pending) continue
      incoming.classList.add('is-visible')
      outgoing.classList.remove('is-visible')
      this.front = back
      this.lastUrl = next
    }
    this.swapping = false
  }
}
