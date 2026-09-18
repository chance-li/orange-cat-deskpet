import type { AnimState } from '../../../shared/constants'
import idle from '../assets/pet/idle.png'
import walk from '../assets/pet/walk.png'
import sleep from '../assets/pet/sleep.png'
import happy from '../assets/pet/happy.png'
import stretch from '../assets/pet/stretch.png'
import lick from '../assets/pet/lick.png'
import surprised from '../assets/pet/surprised.png'
import eat from '../assets/pet/eat.png'

export const SPRITE_URLS = {
  idle,
  walk,
  sleep,
  happy,
  stretch,
  lick,
  surprised,
  eat
} as const

export type SpriteName = keyof typeof SPRITE_URLS

export const STATE_SPRITE: Record<AnimState, SpriteName> = {
  idle: 'idle',
  sit: 'idle',
  walk: 'walk',
  sleep: 'sleep',
  stretch: 'stretch',
  lick: 'lick',
  happy: 'happy',
  surprised: 'surprised',
  eat: 'eat'
}

export const SPRITE_NAMES = Object.keys(SPRITE_URLS) as SpriteName[]
