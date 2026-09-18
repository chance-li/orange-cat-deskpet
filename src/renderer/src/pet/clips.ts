import type { AnimState } from '../../../shared/constants'

import walk01 from '../assets/pet/walk/01.png'
import walk02 from '../assets/pet/walk/02.png'
import walk03 from '../assets/pet/walk/03.png'
import walk04 from '../assets/pet/walk/04.png'
import walk05 from '../assets/pet/walk/05.png'
import walk06 from '../assets/pet/walk/06.png'

import idleOpen from '../assets/pet/idle/eyes-open.png'
import idleHalf from '../assets/pet/idle/blink-half.png'
import idleClosed from '../assets/pet/idle/blink-closed.png'

import sleep01 from '../assets/pet/sleep/01.png'
import sleep02 from '../assets/pet/sleep/02.png'
import sleep03 from '../assets/pet/sleep/03.png'
import sleep04 from '../assets/pet/sleep/04.png'

import happy01 from '../assets/pet/happy/01.png'
import happy02 from '../assets/pet/happy/02.png'
import happy03 from '../assets/pet/happy/03.png'
import happy04 from '../assets/pet/happy/04.png'

import sit01 from '../assets/pet/sit/01.png'
import sit02 from '../assets/pet/sit/02.png'
import sit03 from '../assets/pet/sit/03.png'
import sit04 from '../assets/pet/sit/04.png'
import sit05 from '../assets/pet/sit/05.png'

import stretch01 from '../assets/pet/stretch/01.png'
import stretch02 from '../assets/pet/stretch/02.png'
import stretch03 from '../assets/pet/stretch/03.png'
import stretch04 from '../assets/pet/stretch/04.png'

import lick01 from '../assets/pet/lick/01.png'
import lick02 from '../assets/pet/lick/02.png'
import lick03 from '../assets/pet/lick/03.png'
import lick04 from '../assets/pet/lick/04.png'

import surprised01 from '../assets/pet/surprised/01.png'
import surprised02 from '../assets/pet/surprised/02.png'
import surprised03 from '../assets/pet/surprised/03.png'
import surprised04 from '../assets/pet/surprised/04.png'

import eat01 from '../assets/pet/eat/01.png'
import eat02 from '../assets/pet/eat/02.png'
import eat03 from '../assets/pet/eat/03.png'
import eat04 from '../assets/pet/eat/04.png'

export type ClipMode = 'loop' | 'pingpong' | 'once' | 'idle-blink'

export interface ClipDef {
  frames: string[]
  frameMs: number | number[]
  mode: ClipMode
}

export const CLIPS: Record<AnimState, ClipDef> = {
  walk: {
    frames: [walk01, walk02, walk03, walk04, walk05, walk06],
    frameMs: 100,
    mode: 'loop'
  },
  idle: {
    frames: [idleOpen, idleHalf, idleClosed],
    frameMs: [60, 80, 60],
    mode: 'idle-blink'
  },
  sit: {
    frames: [sit01, sit04, sit01, sit05, sit01, sit02, sit03, sit02],
    frameMs: 420,
    mode: 'loop'
  },
  sleep: {
    frames: [sleep01, sleep02, sleep03, sleep04],
    frameMs: 560,
    mode: 'pingpong'
  },
  happy: {
    frames: [happy01, happy02, happy03, happy04],
    frameMs: 95,
    mode: 'pingpong'
  },
  stretch: {
    frames: [stretch03, stretch04, stretch01, stretch02],
    frameMs: 150,
    mode: 'pingpong'
  },
  lick: {
    frames: [lick03, lick04, lick01, lick02, lick01, lick04],
    frameMs: 140,
    mode: 'loop'
  },
  surprised: {
    frames: [surprised04, surprised01, surprised02],
    frameMs: 85,
    mode: 'once'
  },
  eat: {
    frames: [eat01, eat02, eat03, eat02, eat04],
    frameMs: 170,
    mode: 'once'
  }
}

export const DEFAULT_FRAME = CLIPS.idle.frames[0]

export function allFrameUrls(): string[] {
  const seen = new Set<string>()
  const urls: string[] = []
  for (const clip of Object.values(CLIPS)) {
    for (const url of clip.frames) {
      if (seen.has(url)) continue
      seen.add(url)
      urls.push(url)
    }
  }
  return urls
}

export async function preloadClips(): Promise<void> {
  await Promise.all(
    allFrameUrls().map((url) => {
      const img = new Image()
      img.src = url
      return img.decode().catch(() => undefined)
    })
  )
}
