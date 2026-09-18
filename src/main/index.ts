import { join } from 'node:path'
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Tray,
  screen,
  nativeImage,
  type NativeImage
} from 'electron'
import {
  APP_ID,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
  type DeskpetSettings,
  type MenuAction
} from '../shared/constants'
import { loadSettings, saveSettings } from './settings'
import { createTrayIcon } from './icon'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

function resolveIcon(): NativeImage {
  const packaged = app.isPackaged
    ? join(process.resourcesPath, 'icon.png')
    : join(__dirname, '../../resources/icon.png')
  const fromFile = nativeImage.createFromPath(packaged)
  if (!fromFile.isEmpty()) {
    return fromFile.resize({ width: 32, height: 32 })
  }
  return createTrayIcon()
}

function workAreaAt(x: number, y: number) {
  return screen.getDisplayNearestPoint({ x, y }).workArea
}

function clampToWorkArea(x: number, y: number): { x: number; y: number } {
  const area = workAreaAt(x, y)
  return {
    x: Math.round(Math.min(Math.max(x, area.x), area.x + area.width - WINDOW_WIDTH)),
    y: Math.round(Math.min(Math.max(y, area.y), area.y + area.height - WINDOW_HEIGHT))
  }
}

function defaultSpawn(): { x: number; y: number } {
  const area = screen.getPrimaryDisplay().workArea
  return {
    x: Math.round(area.x + area.width - WINDOW_WIDTH - 48),
    y: Math.round(area.y + area.height - WINDOW_HEIGHT - 8)
  }
}

function createWindow(): BrowserWindow {
  const settings = loadSettings()
  const spawn =
    settings.x != null && settings.y != null
      ? clampToWorkArea(settings.x, settings.y)
      : defaultSpawn()

  const win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: spawn.x,
    y: spawn.y,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: settings.alwaysOnTop,
    focusable: true,
    roundedCorners: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged
    }
  })

  win.setMenuBarVisibility(false)
  if (settings.alwaysOnTop) {
    win.setAlwaysOnTop(true, 'screen-saver')
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  }

  win.on('close', (event) => {
    persistWindowPosition()
    if (!isQuitting) {
      event.preventDefault()
      win.hide()
    }
  })

  win.webContents.on('context-menu', (event) => {
    event.preventDefault()
  })

  if (!app.isPackaged) {
    win.webContents.on('before-input-event', (_event, input) => {
      if (input.key === 'F12' && input.type === 'keyDown') {
        win.webContents.openDevTools({ mode: 'detach' })
      }
    })
  }

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  win.once('ready-to-show', () => {
    win.show()
  })

  return win
}

function persistWindowPosition(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  const [x, y] = mainWindow.getPosition()
  saveSettings({ x, y })
}

function sendAction(action: MenuAction): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.send('menu-action', action)
}

function buildPetMenu(): Menu {
  const settings = loadSettings()
  return Menu.buildFromTemplate([
    { label: '摸摸', click: () => sendAction('pet') },
    { label: '喂食', click: () => sendAction('feed') },
    { label: '玩耍', click: () => sendAction('play') },
    { label: '睡觉', click: () => sendAction('sleep') },
    { type: 'separator' },
    {
      label: '跟随鼠标',
      type: 'checkbox',
      checked: settings.followMouse,
      click: () => sendAction('toggle-follow')
    },
    {
      label: '置顶',
      type: 'checkbox',
      checked: settings.alwaysOnTop,
      click: () => sendAction('toggle-top')
    },
    {
      label: '静音',
      type: 'checkbox',
      checked: settings.muted,
      click: () => sendAction('toggle-mute')
    },
    {
      label: '显示状态',
      type: 'checkbox',
      checked: settings.hudPinned,
      click: () => sendAction('toggle-hud')
    },
    { type: 'separator' },
    {
      label: '隐藏到托盘',
      click: () => {
        persistWindowPosition()
        mainWindow?.hide()
        sendAction('hide')
      }
    },
    {
      label: '退出',
      click: () => {
        isQuitting = true
        persistWindowPosition()
        sendAction('quit')
        app.quit()
      }
    }
  ])
}

function buildTrayMenu(): Menu {
  const settings = loadSettings()
  return Menu.buildFromTemplate([
    {
      label: '显示橘猫',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
        sendAction('show')
      }
    },
    {
      label: '隐藏到托盘',
      click: () => {
        persistWindowPosition()
        mainWindow?.hide()
      }
    },
    { type: 'separator' },
    {
      label: '跟随鼠标',
      type: 'checkbox',
      checked: settings.followMouse,
      click: () => sendAction('toggle-follow')
    },
    {
      label: '置顶',
      type: 'checkbox',
      checked: settings.alwaysOnTop,
      click: () => sendAction('toggle-top')
    },
    {
      label: '静音',
      type: 'checkbox',
      checked: settings.muted,
      click: () => sendAction('toggle-mute')
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true
        persistWindowPosition()
        app.quit()
      }
    }
  ])
}

function refreshTray(): void {
  tray?.setContextMenu(buildTrayMenu())
}

function createTrayIconMenu(): void {
  const icon = resolveIcon()
  tray = new Tray(icon)
  tray.setToolTip('橘猫桌宠')
  refreshTray()
  tray.on('click', () => {
    if (!mainWindow) return
    if (mainWindow.isVisible()) {
      persistWindowPosition()
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

function registerIpc(): void {
  ipcMain.handle('window:move-by', (event, dx: number, dy: number) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { x: 0, y: 0 }
    const [x, y] = win.getPosition()
    const next = clampToWorkArea(x + dx, y + dy)
    win.setPosition(next.x, next.y, false)
    return next
  })

  ipcMain.handle('window:set-position', (event, x: number, y: number) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { x: 0, y: 0 }
    const next = clampToWorkArea(x, y)
    win.setPosition(next.x, next.y, false)
    return next
  })

  ipcMain.handle('window:get-position', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { x: 0, y: 0 }
    const [x, y] = win.getPosition()
    return { x, y }
  })

  ipcMain.handle('window:get-work-area', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return screen.getPrimaryDisplay().workArea
    const [x, y] = win.getPosition()
    return workAreaAt(x, y)
  })

  ipcMain.handle('window:get-cursor', () => screen.getCursorScreenPoint())

  ipcMain.handle('window:set-always-on-top', (event, flag: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.setAlwaysOnTop(flag, flag ? 'screen-saver' : 'normal')
    win?.setVisibleOnAllWorkspaces(flag, { visibleOnFullScreen: true })
    const next = saveSettings({ alwaysOnTop: flag })
    refreshTray()
    event.sender.send('settings:sync', next)
    return flag
  })

  ipcMain.handle('app:hide-to-tray', (event) => {
    persistWindowPosition()
    BrowserWindow.fromWebContents(event.sender)?.hide()
  })

  ipcMain.handle('app:quit', () => {
    isQuitting = true
    persistWindowPosition()
    app.quit()
  })

  ipcMain.handle('menu:show', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    buildPetMenu().popup({ window: win ?? undefined })
  })

  ipcMain.handle('settings:load', () => loadSettings())

  ipcMain.handle('settings:save', (_event, partial: Partial<DeskpetSettings>) => {
    const next = saveSettings(partial)
    refreshTray()
    return next
  })
}

function setupApp(): void {
  app.setAppUserModelId(APP_ID)

  const gotLock = app.requestSingleInstanceLock()
  if (!gotLock) {
    app.quit()
    return
  }

  app.on('second-instance', () => {
    if (!mainWindow) return
    if (!mainWindow.isVisible()) mainWindow.show()
    mainWindow.focus()
  })

  app.whenReady().then(() => {
    registerIpc()
    mainWindow = createWindow()
    createTrayIconMenu()
  })

  app.on('before-quit', () => {
    isQuitting = true
    persistWindowPosition()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      if (isQuitting) app.quit()
    }
  })
}

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals')
  app.commandLine.appendSwitch('no-sandbox')
  app.commandLine.appendSwitch('disable-gpu-sandbox')
}

setupApp()
