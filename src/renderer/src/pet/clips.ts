import type { AnimState } from '../../../shared/constants'

import walk01 from '../assets/pet/walk/01.png'
import walk02 from '../assets/pet/walk/02.png'
import walk03 from '../assets/pet/walk/03.png'
import walk04 from '../assets/pet/walk/04.png'

import idleOpen from '../assets/pet/idle/eyes-open.png'
import idleHalf from '../assets/pet/idle/blink-half.png'
import idleClosed from '../assets/pet/idle/blink-closed.png'

import sleep01 from '../assets/pet/sleep/01.png'
import sleep02 from '../assets/pet/sleep/02.png'

import happy01 from '../assets/pet/happy/01.png'
import happy02 from '../assets/pet/happy/02.png'

import sit01 from '../assets/pet/sit/01.png'
import sit02 from '../assets/pet/sit/02.png'
import sit03 from '../assets/pet/sit/03.png'

import stretch01 from '../assets/pet/stretch/01.png'
import stretch02 from '../assets/pet/stretch/02.png'
import stretch03 from '../assets/pet/stretch/03.png'

import lick01 from '../assets/pet/lick/01.png'
import lick02 from '../assets/pet/lick/02.png'
import lick03 from '../assets/pet/lick/03.png'

import surprised01 from '../assets/pet/surprised/01.png'
import surprised02 from '../assets/pet/surprised/02.png'
import surprised03 from '../assets/pet/surprised/03.png'

import eat01 from '../assets/pet/eat/01.png'
import eat02 from '../assets/pet/eat/02.png'
import eat03 from '../assets/pet/eat/03.png'
import eat04 from '../assets/pet/eat/04.png'

export type ClipMode = 'loop' | 'pingpong' | 'once' | 'idle-blink'

export interface ClipDef {
  frames: string[]
  /** Per-frame duration, or a list matching each frame. */
  frameMs: number | number[]
  mode: ClipMode
}

export const CLIPS: Record<AnimState, ClipDef> = {
  walk: {
    frames: [walk01, walk02, walk03, walk04],
    frameMs: 120,
    mode: 'loop'
  },
  idle: {
    frames: [idleOpen, idleHalf, idleClosed],
    frameMs: [70, 90, 70],
    mode: 'idle-blink'
  },
  sit: {
    frames: [sit01, sit02, sit03, sit02],
    frameMs: 480,
    mode: 'loop'
  },
  sleep: {
    frames: [sleep01, sleep02],
    frameMs: 640,
    mode: 'pingpong'
  },
  happy: {
    frames: [happy01, happy02],
    frameMs: 100,
    mode: 'pingpong'
  },
  stretch: {
    frames: [stretch01, stretch02, stretch03],
    frameMs: 160,
    mode: 'pingpong'
  },
  lick: {
    frames: [lick01, lick02, lick03, lick02],
    frameMs: 150,
    mode: 'loop'
  },
  surprised: {
    frames: [surprised01, surprised02, surprised03],
    frameMs: 90,
    mode: 'once'
  },
  eat: {
    frames: [eat01, eat02, eat03, eat02, eat03, eat02, eat04],
    frameMs: 180,
    mode: 'once'
  }
}

export const DEFAULT_FRAME = CLIPS.idle.frames[0]

export function preloadClips(): void {
  const seen = new Set<string>()
  for (const clip of Object.values(CLIPS)) {
    for (const url of clip.frames) {
      if (seen.has(url)) continue
      seen.add(url)
      const img = new Image()
      img.src = url
    }
  }
}
