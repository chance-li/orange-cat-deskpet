import type { AnimState, DeskpetSettings, MenuAction, Point, Rect } from '../../../shared/constants'
import { WINDOW_HEIGHT, WINDOW_WIDTH } from '../../../shared/constants'
import { SpriteAnimator } from '../pet/SpriteAnimator'
import { PetAudio } from './audio'

const HUNGER_PER_SEC = 100 / (18 * 60)
const MOOD_PER_SEC = 100 / (28 * 60)
const GRAVITY = 1600
const WALK_SPEED = 72
const FOLLOW_SPEED = 150
const DRAG_THRESHOLD = 5
const CLICK_MS = 280

const ONE_SHOT: Partial<Record<AnimState, number>> = {
  stretch: 1800,
  lick: 1400,
  happy: 1600,
  surprised: 900,
  eat: 3600
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export class PetEngine {
  private readonly pet: HTMLElement
  private readonly hud: HTMLElement
  private readonly moodBar: HTMLElement
  private readonly hungerBar: HTMLElement
  private readonly moodVal: HTMLElement
  private readonly hungerVal: HTMLElement
  private readonly animator: SpriteAnimator
  private readonly audio = new PetAudio()

  private x = 0
  private y = 0
  private vx = 0
  private vy = 0
  private facing: 1 | -1 = 1
  private hunger = 82
  private mood = 78
  private state: AnimState = 'idle'
  private stateUntil = 0
  private nextThink = 0
  private walkUntil = 0
  private followMouse = false
  private alwaysOnTop = true
  private hudPinned = false
  private hovering = false
  private dragging = false
  private airborne = false
  private playing = false
  private dragMoved = false
  private pointerStart: Point = { x: 0, y: 0 }
  private lastClickAt = 0
  private cursor: Point = { x: 0, y: 0 }
  private workArea: Rect = { x: 0, y: 0, width: 1920, height: 1080 }
  private cursorInFlight = false
  private posInFlight = false
  private lastSentX = Number.NaN
  private lastSentY = Number.NaN
  private lastTs = 0
  private lastAreaSync = 0
  private running = false

  constructor(private readonly root: HTMLElement) {
    this.pet = root.querySelector('#pet') as HTMLElement
    this.hud = root.querySelector('#hud') as HTMLElement
    this.moodBar = root.querySelector('#mood-bar') as HTMLElement
    this.hungerBar = root.querySelector('#hunger-bar') as HTMLElement
    this.moodVal = root.querySelector('#mood-val') as HTMLElement
    this.hungerVal = root.querySelector('#hunger-val') as HTMLElement
    const sprites = root.querySelector('.sprites') as HTMLElement
    this.animator = new SpriteAnimator(sprites)
  }

  async start(): Promise<void> {
    await this.animator.ready()
    const settings = await window.deskpet.loadSettings()
    this.applySettings(settings)
    const pos = await window.deskpet.getPosition()
    this.x = pos.x
    this.y = pos.y
    this.workArea = await window.deskpet.getWorkArea()
    this.airborne = this.y < this.groundY() - 6
    this.bind()
    this.setState('idle')
    this.updateHud()
    this.running = true
    this.lastTs = performance.now()
    this.nextThink = this.lastTs + rand(1800, 4200)
    requestAnimationFrame(this.tick)
  }

  private applySettings(settings: DeskpetSettings): void {
    this.followMouse = settings.followMouse
    this.alwaysOnTop = settings.alwaysOnTop
    this.hudPinned = settings.hudPinned
    this.audio.setMuted(settings.muted)
    this.syncHudVisibility()
  }

  private bind(): void {
    this.pet.addEventListener('pointerdown', (event) => this.onPointerDown(event))
    window.addEventListener('pointermove', (event) => this.onPointerMove(event))
    window.addEventListener('pointerup', (event) => this.onPointerUp(event), true)
    window.addEventListener('pointercancel', (event) => this.onPointerUp(event), true)
    this.pet.addEventListener('dblclick', (event) => {
      event.preventDefault()
      this.reactDoubleClick()
    })
    this.root.addEventListener('contextmenu', (event) => {
      event.preventDefault()
      void window.deskpet.showContextMenu()
    })
    this.root.addEventListener('pointerenter', () => {
      this.hovering = true
      this.syncHudVisibility()
    })
    this.root.addEventListener('pointerleave', () => {
      if (!this.dragging) this.hovering = false
      this.syncHudVisibility()
    })
    window.deskpet.onMenuAction((action) => {
      void this.onMenu(action)
    })
    if (import.meta.env.DEV) {
      window.addEventListener('keydown', (event) => this.onDebugKey(event))
    }
  }

  private onDebugKey(event: KeyboardEvent): void {
    const map: Record<string, AnimState> = {
      Digit1: 'idle',
      Digit2: 'walk',
      Digit3: 'sit',
      Digit4: 'sleep',
      Digit5: 'happy',
      Digit6: 'stretch',
      Digit7: 'lick',
      Digit8: 'surprised',
      Digit9: 'eat'
    }
    const next = map[event.code]
    if (!next) return
    event.preventDefault()
    if (next === 'walk') {
      this.startWalk(performance.now(), 8000)
    } else {
      this.playing = false
      this.vx = 0
      this.setState(next)
    }
    this.nextThink = performance.now() + 9000
  }

  private tick = (ts: number): void => {
    if (!this.running) return
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000)
    this.lastTs = ts
    this.updateStats(dt)
    this.animator.tick(ts)
    this.pollCursor()
    if (ts - this.lastAreaSync > 800) {
      this.lastAreaSync = ts
      void window.deskpet.getWorkArea().then((area) => {
        this.workArea = area
      })
    }
    if (this.dragging) {
      this.render()
      requestAnimationFrame(this.tick)
      return
    } else if (this.followMouse) {
      this.followCursor(dt)
    } else {
      this.think(ts)
      this.integrate(dt, ts)
    }
    this.render()
    requestAnimationFrame(this.tick)
  }

  private pollCursor(): void {
    if (!(this.dragging || this.followMouse) || this.cursorInFlight) return
    this.cursorInFlight = true
    void window.deskpet.getCursor().then((point) => {
      this.cursor = point
      this.cursorInFlight = false
    })
  }

  private updateStats(dt: number): void {
    const hungerMul = this.state === 'sleep' ? 0.45 : this.playing ? 1.4 : 1
    const moodMul = this.hunger < 20 ? 1.6 : this.state === 'sleep' ? 0.35 : 1
    this.hunger = clamp(this.hunger - HUNGER_PER_SEC * hungerMul * dt, 0, 100)
    this.mood = clamp(this.mood - MOOD_PER_SEC * moodMul * dt, 0, 100)
  }

  private think(ts: number): void {
    if (this.playing) return
    if (ONE_SHOT[this.state] && ts < this.stateUntil) return
    if (ONE_SHOT[this.state] && ts >= this.stateUntil) {
      this.setState(this.hunger < 25 ? 'sit' : 'idle')
    }
    if (this.airborne) return
    if (ts < this.nextThink) return
    if (this.state === 'walk' && ts < this.walkUntil) return

    const hungry = this.hunger < 22
    const sad = this.mood < 28
    const weights: Array<[AnimState, number]> = hungry
      ? [
          ['sit', 4],
          ['sleep', 1.2],
          ['idle', 2],
          ['surprised', 0.8],
          ['walk', 0.6]
        ]
      : sad
        ? [
            ['sit', 3],
            ['sleep', 2.4],
            ['idle', 2],
            ['lick', 0.8],
            ['walk', 0.7]
          ]
        : [
            ['idle', 2.2],
            ['walk', 2.6],
            ['sit', 1.6],
            ['sleep', 0.9],
            ['stretch', 1.1],
            ['lick', 1]
          ]

    const next = this.weighted(weights)
    if (next === 'walk') {
      this.startWalk(ts, rand(1400, 3400))
    } else {
      this.vx = 0
      this.setState(next)
      if (next === 'surprised' && hungry) this.audio.meow()
    }
    this.nextThink = ts + rand(2800, 7000)
  }

  private weighted(items: Array<[AnimState, number]>): AnimState {
    const total = items.reduce((sum, [, w]) => sum + w, 0)
    let roll = Math.random() * total
    for (const [state, weight] of items) {
      roll -= weight
      if (roll <= 0) return state
    }
    return items[0][0]
  }

  private startWalk(ts: number, duration: number, dir?: 1 | -1, keepPlaying = false): void {
    if (!keepPlaying) this.playing = false
    this.facing = dir ?? (Math.random() < 0.5 ? -1 : 1)
    this.vx = WALK_SPEED * this.facing
    this.walkUntil = ts + duration
    this.setState('walk')
  }

  private groundY(): number {
    return this.workArea.y + this.workArea.height - WINDOW_HEIGHT
  }

  private integrate(dt: number, ts: number): void {
    const minX = this.workArea.x
    const maxX = this.workArea.x + this.workArea.width - WINDOW_WIDTH
    const minY = this.workArea.y
    const ground = this.groundY()

    if (this.y < ground - 3) {
      this.airborne = true
      this.vy += GRAVITY * dt
      this.y += this.vy * dt
      if (this.y >= ground) {
        this.y = ground
        this.vy = 0
        this.airborne = false
        this.vx = 0
        if (!ONE_SHOT[this.state] && this.state !== 'sleep') {
          this.setState('sit')
          this.nextThink = ts + rand(1600, 2800)
        }
        void window.deskpet.saveSettings({ x: Math.round(this.x), y: Math.round(this.y) })
      }
    } else {
      this.airborne = false
      this.vy = 0
      this.y = ground
    }

    if (this.state === 'walk' && !this.airborne) {
      this.x += this.vx * dt
      if (this.x <= minX) {
        this.x = minX
        this.facing = 1
        this.vx = WALK_SPEED
      } else if (this.x >= maxX) {
        this.x = maxX
        this.facing = -1
        this.vx = -WALK_SPEED
      }
      if (ts >= this.walkUntil && !this.playing) {
        this.vx = 0
        this.setState(pick(['idle', 'sit', 'stretch']))
        this.nextThink = ts + rand(2000, 4500)
      }
    } else if (!this.airborne) {
      this.vx = 0
    }

    this.x = clamp(this.x, minX, maxX)
    this.y = clamp(this.y, minY, ground)
    this.syncWindow()
  }

  private followCursor(dt: number): void {
    const targetX = this.cursor.x - WINDOW_WIDTH * 0.45
    const targetY = this.cursor.y - WINDOW_HEIGHT * 0.25
    const dx = targetX - this.x
    const dy = targetY - this.y
    const dist = Math.hypot(dx, dy)
    if (dist > 18) {
      const step = Math.min(dist, FOLLOW_SPEED * dt)
      this.x += (dx / dist) * step
      this.y += (dy / dist) * step
      this.facing = dx >= 0 ? 1 : -1
      if (this.state !== 'walk' && this.state !== 'happy') this.setState('walk')
    } else if (!ONE_SHOT[this.state]) {
      this.setState(this.hunger < 30 ? 'sit' : 'idle')
    }
    this.airborne = this.y < this.groundY() - 8
    this.syncWindow()
  }

  private syncWindow(): void {
    const x = Math.round(this.x)
    const y = Math.round(this.y)
    if (x === this.lastSentX && y === this.lastSentY) return
    if (this.posInFlight) return
    this.posInFlight = true
    this.lastSentX = x
    this.lastSentY = y
    void window.deskpet.setPosition(x, y).then((point) => {
      this.x = point.x
      this.y = point.y
      this.lastSentX = Math.round(point.x)
      this.lastSentY = Math.round(point.y)
      this.posInFlight = false
    })
  }

  private persist(partial: Partial<DeskpetSettings>): void {
    void window.deskpet.saveSettings({
      ...partial,
      x: Math.round(this.x),
      y: Math.round(this.y)
    })
  }

  private setState(state: AnimState): void {
    const changed = this.state !== state
    this.state = state
    const duration = ONE_SHOT[state]
    this.stateUntil = duration ? performance.now() + duration : 0
    if (state !== 'walk' && state !== 'happy') this.playing = false
    if (changed || duration) this.animator.play(state)
  }

  private render(): void {
    this.pet.dataset.state = this.state
    this.pet.classList.toggle('facing-right', this.facing === 1)
    this.pet.classList.toggle('facing-left', this.facing === -1)
    this.pet.classList.toggle('dragging', this.dragging)
    this.pet.classList.toggle('airborne', this.airborne)
    this.pet.classList.toggle('hungry', this.hunger < 24)
    this.pet.classList.toggle('low-mood', this.mood < 28)
    this.pet.classList.toggle('playing', this.playing)
    for (const name of [
      'idle',
      'walk',
      'sit',
      'sleep',
      'stretch',
      'lick',
      'happy',
      'surprised',
      'eat'
    ] as AnimState[]) {
      this.pet.classList.toggle(`state-${name}`, this.state === name)
    }
    this.updateHud()
  }

  private updateHud(): void {
    const mood = Math.round(this.mood)
    const hunger = Math.round(this.hunger)
    this.moodBar.style.width = `${mood}%`
    this.hungerBar.style.width = `${hunger}%`
    this.moodVal.textContent = String(mood)
    this.hungerVal.textContent = String(hunger)
    this.moodBar.classList.toggle('low', mood < 25)
    this.hungerBar.classList.toggle('low', hunger < 25)
    this.moodBar.parentElement?.classList.toggle('low', mood < 25)
    this.hungerBar.parentElement?.classList.toggle('low', hunger < 25)
  }

  private syncHudVisibility(): void {
    this.hud.hidden = !(this.hudPinned || this.hovering || this.dragging)
  }

  private onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return
    event.preventDefault()
    this.pet.setPointerCapture(event.pointerId)
    this.dragging = true
    this.dragMoved = false
    this.pointerStart = { x: event.screenX, y: event.screenY }
    this.cursor = { x: event.screenX, y: event.screenY }
    this.pet.classList.add('dragging')
    this.setState('surprised')
    void window.deskpet.beginDrag()
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.dragging) return
    this.cursor = { x: event.screenX, y: event.screenY }
    if (Math.hypot(event.screenX - this.pointerStart.x, event.screenY - this.pointerStart.y) > DRAG_THRESHOLD) {
      this.dragMoved = true
    }
  }

  private onPointerUp(event: PointerEvent): void {
    if (!this.dragging) return
    this.dragging = false
    this.hovering = true
    this.pet.classList.remove('dragging')
    try {
      this.pet.releasePointerCapture(event.pointerId)
    } catch {
      /* already released */
    }
    void window.deskpet.endDrag().then((point) => {
      this.x = point.x
      this.y = point.y
      this.lastSentX = Math.round(point.x)
      this.lastSentY = Math.round(point.y)
      const moved =
        this.dragMoved ||
        Math.hypot(event.screenX - this.pointerStart.x, event.screenY - this.pointerStart.y) > DRAG_THRESHOLD
      if (!moved) {
        this.reactClick()
      } else {
        this.vy = 0
        this.airborne = this.y < this.groundY() - 6
        if (this.airborne) this.setState('surprised')
        else this.setState('sit')
      }
      this.syncHudVisibility()
    })
  }

  private reactClick(): void {
    const now = performance.now()
    if (now - this.lastClickAt < 320) return
    this.lastClickAt = now
    this.petAction()
  }

  private reactDoubleClick(): void {
    this.lastClickAt = performance.now()
    this.mood = clamp(this.mood + 10, 0, 100)
    this.setState('happy')
    this.audio.meow()
    this.nextThink = performance.now() + 2000
  }

  private petAction(): void {
    this.mood = clamp(this.mood + 16, 0, 100)
    this.setState(this.hunger < 18 ? 'surprised' : pick(['happy', 'lick', 'happy']))
    this.audio.purr()
    if (this.hunger < 18) this.audio.meow()
    this.nextThink = performance.now() + 1800
  }

  private feed(): void {
    this.hunger = clamp(this.hunger + 28, 0, 100)
    this.mood = clamp(this.mood + 10, 0, 100)
    this.playing = false
    this.vx = 0
    this.setState('eat')
    this.audio.chomp()
    window.setTimeout(() => this.audio.meow(), 280)
    this.nextThink = performance.now() + 2400
  }

  private play(): void {
    this.mood = clamp(this.mood + 22, 0, 100)
    this.hunger = clamp(this.hunger - 6, 0, 100)
    this.playing = true
    this.audio.meow()
    this.setState('happy')
    window.setTimeout(() => {
      if (!this.running) return
      this.startWalk(performance.now(), 2600, this.facing, true)
      this.playing = true
    }, 700)
    window.setTimeout(() => {
      this.playing = false
      if (this.state === 'walk') this.setState('sit')
    }, 3400)
    this.nextThink = performance.now() + 4200
  }

  private sleep(): void {
    this.followMouse = false
    this.playing = false
    this.vx = 0
    this.mood = clamp(this.mood + 8, 0, 100)
    this.setState('sleep')
    this.nextThink = performance.now() + rand(8000, 14000)
    this.persist({ followMouse: false })
  }

  private async onMenu(action: MenuAction): Promise<void> {
    console.log('[renderer] 菜单动作', action)
    switch (action) {
      case 'pet':
        this.petAction()
        break
      case 'feed':
        this.feed()
        break
      case 'play':
        this.play()
        break
      case 'sleep':
        this.sleep()
        break
      case 'toggle-follow':
        this.followMouse = !this.followMouse
        if (this.followMouse) this.setState('walk')
        else this.setState('idle')
        this.persist({ followMouse: this.followMouse })
        break
      case 'toggle-top':
        this.alwaysOnTop = !this.alwaysOnTop
        await window.deskpet.setAlwaysOnTop(this.alwaysOnTop)
        this.persist({ alwaysOnTop: this.alwaysOnTop })
        break
      case 'toggle-mute':
        this.audio.setMuted(!this.audio.muted)
        this.persist({ muted: this.audio.muted })
        if (!this.audio.muted) this.audio.meow()
        break
      case 'toggle-hud':
        this.hudPinned = !this.hudPinned
        this.syncHudVisibility()
        this.persist({ hudPinned: this.hudPinned })
        break
      case 'hide':
        this.persist({})
        break
      case 'show':
        break
      case 'quit':
        this.persist({})
        break
    }
  }
}
