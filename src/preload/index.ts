import { contextBridge, ipcRenderer } from 'electron'
import type { DeskpetSettings, MenuAction, Point, Rect } from '../shared/constants'

const api = {
  moveBy(dx: number, dy: number): Promise<Point> {
    return ipcRenderer.invoke('window:move-by', dx, dy)
  },
  setPosition(x: number, y: number): Promise<Point> {
    return ipcRenderer.invoke('window:set-position', x, y)
  },
  getPosition(): Promise<Point> {
    return ipcRenderer.invoke('window:get-position')
  },
  getWorkArea(): Promise<Rect> {
    return ipcRenderer.invoke('window:get-work-area')
  },
  getCursor(): Promise<Point> {
    return ipcRenderer.invoke('window:get-cursor')
  },
  setAlwaysOnTop(flag: boolean): Promise<boolean> {
    return ipcRenderer.invoke('window:set-always-on-top', flag)
  },
  hideToTray(): Promise<void> {
    return ipcRenderer.invoke('app:hide-to-tray')
  },
  quit(): Promise<void> {
    return ipcRenderer.invoke('app:quit')
  },
  showContextMenu(): Promise<void> {
    return ipcRenderer.invoke('menu:show')
  },
  loadSettings(): Promise<DeskpetSettings> {
    return ipcRenderer.invoke('settings:load')
  },
  saveSettings(partial: Partial<DeskpetSettings>): Promise<DeskpetSettings> {
    return ipcRenderer.invoke('settings:save', partial)
  },
  onMenuAction(callback: (action: MenuAction) => void): () => void {
    const listener = (_event: unknown, action: MenuAction) => callback(action)
    ipcRenderer.on('menu-action', listener)
    return () => ipcRenderer.removeListener('menu-action', listener)
  }
}

contextBridge.exposeInMainWorld('deskpet', api)
