import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type {
  AppSettings,
  DeleteResult,
  DriveInfo,
  LogEntry,
  ScanCandidate,
  ScanOptions,
  ScanProgress,
  ScanSummary
} from '@shared/types'

const nodeSweepApi = {
  selectFolder: (): Promise<string | null> => ipcRenderer.invoke(IpcChannels.SelectFolder),
  listDrives: (): Promise<DriveInfo[]> => ipcRenderer.invoke(IpcChannels.ListDrives),

  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IpcChannels.GetSettings),
  updateSettings: (partial: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke(IpcChannels.UpdateSettings, partial),

  scan: (options: ScanOptions): Promise<ScanSummary> =>
    ipcRenderer.invoke(IpcChannels.ScanRun, options),
  cancelScan: (): void => {
    ipcRenderer.send(IpcChannels.ScanCancel)
  },
  onScanProgress: (callback: (progress: ScanProgress) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: ScanProgress): void =>
      callback(progress)
    ipcRenderer.on(IpcChannels.ScanProgress, listener)
    return () => ipcRenderer.removeListener(IpcChannels.ScanProgress, listener)
  },

  deleteCandidates: (candidates: ScanCandidate[]): Promise<DeleteResult[]> =>
    ipcRenderer.invoke(IpcChannels.DeleteCandidates, candidates),

  getLogs: (): Promise<LogEntry[]> => ipcRenderer.invoke(IpcChannels.LogsGet),
  clearLogs: (): Promise<void> => ipcRenderer.invoke(IpcChannels.LogsClear),
  reportLog: (entry: Pick<LogEntry, 'level' | 'message' | 'details'>): void => {
    ipcRenderer.send(IpcChannels.LogsReport, entry)
  },
  onLogEntry: (callback: (entry: LogEntry) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, entry: LogEntry): void => callback(entry)
    ipcRenderer.on(IpcChannels.LogsEntry, listener)
    return () => ipcRenderer.removeListener(IpcChannels.LogsEntry, listener)
  },

  minimizeWindow: (): void => {
    ipcRenderer.send(IpcChannels.WindowMinimize)
  },
  closeWindow: (): void => {
    ipcRenderer.send(IpcChannels.WindowClose)
  }
}

export type NodeSweepApi = typeof nodeSweepApi

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('nodeSweep', nodeSweepApi)
} else {
  (window as unknown as { nodeSweep: NodeSweepApi }).nodeSweep = nodeSweepApi
}
