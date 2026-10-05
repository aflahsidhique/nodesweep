import { ipcMain, dialog, BrowserWindow } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type { LogEntry, ScanCandidate, ScanOptions } from '@shared/types'
import { getSettings, updateSettings } from '../services/settings.service'
import { listDrives } from '../services/drives.service'
import { scanRoots, type ScanController } from '../services/scanner.service'
import { deleteCandidates } from '../services/deletion.service'
import { addLog, clearLogs, getLogs } from '../services/log.service'

let activeScan: ScanController | null = null

type InvokeListener = Parameters<typeof ipcMain.handle>[1]

function handle(channel: string, listener: InvokeListener): void {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      return await listener(event, ...args)
    } catch (err) {
      console.error(`IPC "${channel}" failed:`, err)
      throw err
    }
  })
}

export function registerIpcHandlers(getWindow: () => BrowserWindow | null): void {
  handle(IpcChannels.SelectFolder, async () => {
    const window = getWindow()
    if (!window) return null
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  handle(IpcChannels.ListDrives, () => listDrives())

  handle(IpcChannels.GetSettings, () => getSettings())

  handle(IpcChannels.UpdateSettings, (_event, partial) => updateSettings(partial))

  handle(IpcChannels.ScanRun, async (event, options: ScanOptions) => {
    const controller: ScanController = { cancelled: false }
    activeScan = controller
    try {
      const summary = await scanRoots(options, controller, (progress) => {
        event.sender.send(IpcChannels.ScanProgress, progress)
      })
      updateSettings({ lastScan: summary })
      return summary
    } finally {
      if (activeScan === controller) activeScan = null
    }
  })

  ipcMain.on(IpcChannels.ScanCancel, () => {
    if (activeScan) activeScan.cancelled = true
  })

  handle(IpcChannels.DeleteCandidates, async (_event, candidates: ScanCandidate[]) => {
    const settings = getSettings()
    const results = await deleteCandidates(candidates, settings.roots)
    for (const failed of results.filter((r) => !r.success)) {
      addLog('error', 'main', `Failed to delete ${failed.path}`, failed.error)
    }

    if (settings.lastScan) {
      const deletedIds = new Set(results.filter((r) => r.success).map((r) => r.id))
      const remaining = settings.lastScan.candidates.filter((c) => !deletedIds.has(c.id))
      const unused = remaining.filter((c) => c.status === 'candidate')
      updateSettings({
        lastScan: {
          ...settings.lastScan,
          candidates: remaining,
          projectsScanned: remaining.length,
          unusedCount: unused.length,
          reclaimableBytes: unused.reduce((sum, c) => sum + c.sizeBytes, 0)
        }
      })
    }

    return results
  })

  ipcMain.handle(IpcChannels.LogsGet, () => getLogs())

  ipcMain.handle(IpcChannels.LogsClear, () => clearLogs())

  ipcMain.on(
    IpcChannels.LogsReport,
    (_event, entry: Pick<LogEntry, 'level' | 'message' | 'details'>) => {
      addLog(entry.level, 'renderer', entry.message, entry.details)
    }
  )

  ipcMain.on(IpcChannels.WindowMinimize, () => {
    getWindow()?.minimize()
  })

  ipcMain.on(IpcChannels.WindowClose, () => {
    getWindow()?.close()
  })
}
