import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { DEFAULT_SETTINGS, type DeskpetSettings } from '../shared/constants'

function settingsPath(): string {
  return path.join(app.getPath('userData'), 'deskpet-settings.json')
}

export function loadSettings(): DeskpetSettings {
  try {
    const raw = fs.readFileSync(settingsPath(), 'utf8')
    const parsed = JSON.parse(raw) as Partial<DeskpetSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(partial: Partial<DeskpetSettings>): DeskpetSettings {
  const next = { ...loadSettings(), ...partial }
  const file = settingsPath()
  const dir = path.dirname(file)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const tmp = `${file}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2), 'utf8')
  fs.renameSync(tmp, file)
  return next
}
