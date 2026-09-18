import type { DeskpetSettings, MenuAction, Point, Rect } from '../shared/constants'

export interface DeskpetAPI {
  moveBy(dx: number, dy: number): Promise<Point>
  setPosition(x: number, y: number): Promise<Point>
  getPosition(): Promise<Point>
  getWorkArea(): Promise<Rect>
  getCursor(): Promise<Point>
  setAlwaysOnTop(flag: boolean): Promise<boolean>
  hideToTray(): Promise<void>
  quit(): Promise<void>
  showContextMenu(): Promise<void>
  loadSettings(): Promise<DeskpetSettings>
  saveSettings(partial: Partial<DeskpetSettings>): Promise<DeskpetSettings>
  onMenuAction(callback: (action: MenuAction) => void): () => void
}

declare global {
  interface Window {
    deskpet: DeskpetAPI
  }
}

export {}
