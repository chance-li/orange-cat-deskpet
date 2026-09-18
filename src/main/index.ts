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
let dragTimer: ReturnType<typeof setInterval> | null = null
let dragOffset = { x: 0, y: 0 }

function stopDragLoop(): void {
  if (dragTimer) {
    clearInterval(dragTimer)
    dragTimer = null
  }
}

function resourceFile(name: string): string {
  return app.isPackaged
    ? join(process.resourcesPath, name)
    : join(__dirname, '../../resources', name)
}

function loadNativePng(name: string, size: number): NativeImage | null {
  const image = nativeImage.createFromPath(resourceFile(name))
  if (image.isEmpty()) return null
  return image.resize({ width: size, height: size })
}

function resolveTrayIcon(): NativeImage {
  return loadNativePng('tray.png', 32) ?? loadNativePng('icon.png', 32) ?? createTrayIcon()
}

function resolveAppIcon(): NativeImage {
  return loadNativePng('icon.png', 256) ?? loadNativePng('tray.png', 256) ?? createTrayIcon()
}

function workAreaAt(x: number, y: number) {
  const display = screen.getDisplayNearestPoint({ x, y })
  const area = { ...display.workArea }
  const fullHeight = display.bounds.height - 8
  if (area.y === display.bounds.y && area.height >= fullHeight) {
    area.height = Math.max(WINDOW_HEIGHT + 40, area.height - 72)
  }
  return area
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
    y: Math.round(area.y + area.height - WINDOW_HEIGHT - 56)
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
    minWidth: WINDOW_WIDTH,
    maxWidth: WINDOW_WIDTH,
    minHeight: WINDOW_HEIGHT,
    maxHeight: WINDOW_HEIGHT,
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
    icon: resolveAppIcon(),
    focusable: true,
    roundedCorners: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
      devTools: !app.isPackaged
    }
  })

  win.setMenuBarVisibility(false)
  if (settings.alwaysOnTop) {
    win.setAlwaysOnTop(true, 'screen-saver')
    if (process.platform === 'darwin') {
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    }
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

  win.once('ready-to-show', () => {
    win.setBounds({ x: spawn.x, y: spawn.y, width: WINDOW_WIDTH, height: WINDOW_HEIGHT })
    win.show()
  })
  win.webContents.on('did-finish-load', async () => {
    console.log('[橘猫] 页面已加载', win.webContents.getURL())
    win.setBounds({ x: spawn.x, y: spawn.y, width: WINDOW_WIDTH, height: WINDOW_HEIGHT })
    if (!win.isVisible()) win.show()
    try {
      const info = await win.webContents.executeJavaScript(
        `({state: document.querySelector('#pet')?.dataset.state, len: document.getElementById('app')?.innerHTML.length, api: typeof window.deskpet})`
      )
      console.log('[橘猫] DOM', info)
    } catch (error) {
      console.error('[橘猫] 无法读取 DOM', error)
    }
  })
  win.webContents.on('did-fail-load', (_event, code, desc, url) => {
    console.error('[橘猫] 页面加载失败', code, desc, url)
  })
  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('[橘猫] 渲染进程退出', details)
  })
  win.webContents.on('console-message', (_event, _level, message) => {
    console.log('[renderer]', message)
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

function placeWindow(win: BrowserWindow, x: number, y: number): { x: number; y: number } {
  const next = clampToWorkArea(Number(x) || 0, Number(y) || 0)
  win.setBounds(
    {
      x: next.x,
      y: next.y,
      width: WINDOW_WIDTH,
      height: WINDOW_HEIGHT
    },
    false
  )
  return next
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
  const icon = resolveTrayIcon()
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
  ipcMain.handle('drag:begin', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    const cursor = screen.getCursorScreenPoint()
    const [x, y] = win.getPosition()
    dragOffset = { x: cursor.x - x, y: cursor.y - y }
    stopDragLoop()
    dragTimer = setInterval(() => {
      if (!win || win.isDestroyed()) {
        stopDragLoop()
        return
      }
      const point = screen.getCursorScreenPoint()
      placeWindow(win, point.x - dragOffset.x, point.y - dragOffset.y)
    }, 16)
  })

  ipcMain.handle('drag:end', (event) => {
    stopDragLoop()
    persistWindowPosition()
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { x: 0, y: 0 }
    const [x, y] = win.getPosition()
    return { x, y }
  })

  ipcMain.handle('window:move-by', (event, dx: number, dy: number) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { x: 0, y: 0 }
    const [x, y] = win.getPosition()
    return placeWindow(win, x + (Number(dx) || 0), y + (Number(dy) || 0))
  })

  ipcMain.handle('window:set-position', (event, x: number, y: number) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { x: 0, y: 0 }
    return placeWindow(win, x, y)
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
    if (process.platform === 'darwin') {
      win?.setVisibleOnAllWorkspaces(flag, { visibleOnFullScreen: true })
    }
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
    stopDragLoop()
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
  app.commandLine.appendSwitch('disable-dev-shm-usage')
  app.commandLine.appendSwitch('ignore-gpu-blocklist')
  app.commandLine.appendSwitch('use-gl', 'angle')
  app.commandLine.appendSwitch('use-angle', 'swiftshader')
}

setupApp()
