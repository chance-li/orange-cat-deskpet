export const WINDOW_WIDTH = 200
export const WINDOW_HEIGHT = 240

export const APP_ID = 'com.deskpet.orangecat'

export type AnimState =
  | 'idle'
  | 'walk'
  | 'sit'
  | 'sleep'
  | 'stretch'
  | 'lick'
  | 'happy'
  | 'surprised'
  | 'eat'

export type MenuAction =
  | 'pet'
  | 'feed'
  | 'play'
  | 'sleep'
  | 'toggle-follow'
  | 'toggle-top'
  | 'toggle-mute'
  | 'toggle-hud'
  | 'hide'
  | 'quit'
  | 'show'

export interface DeskpetSettings {
  x: number | null
  y: number | null
  muted: boolean
  followMouse: boolean
  alwaysOnTop: boolean
  hudPinned: boolean
}

export const DEFAULT_SETTINGS: DeskpetSettings = {
  x: null,
  y: null,
  muted: false,
  followMouse: false,
  alwaysOnTop: true,
  hudPinned: false
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}
