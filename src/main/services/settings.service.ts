import Store from 'electron-store'
import type { AppSettings } from '@shared/types'

const defaults: AppSettings = {
  roots: [],
  inactivityDays: 7,
  minSizeMB: 100,
  includeSubdirectories: true,
  detectGitActivity: true
}

const store = new Store<AppSettings>({ name: 'nodesweep-settings', defaults })

export function getSettings(): AppSettings {
  return store.store
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  store.set(partial)
  return store.store
}
