import { BrowserWindow } from 'electron'
import { randomUUID } from 'crypto'
import { format } from 'util'
import { IpcChannels } from '@shared/ipc-channels'
import type { LogEntry, LogLevel, LogSource } from '@shared/types'

const MAX_ENTRIES = 500

const entries: LogEntry[] = []

export function addLog(
  level: LogLevel,
  source: LogSource,
  message: string,
  details?: string
): LogEntry {
  const entry: LogEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
    details
  }
  entries.push(entry)
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES)

  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send(IpcChannels.LogsEntry, entry)
  }
  return entry
}

export function getLogs(): LogEntry[] {
  return [...entries]
}

export function clearLogs(): void {
  entries.length = 0
}

function describe(args: unknown[]): { message: string; details?: string } {
  const error = args.find((a): a is Error => a instanceof Error)
  const message = format(...args.map((a) => (a instanceof Error ? a.message : a)))
  return { message, details: error?.stack }
}

// Mirrors main-process console errors/warnings and crashes into the in-app error console.
export function installMainProcessLogging(): void {
  const originalError = console.error.bind(console)
  const originalWarn = console.warn.bind(console)

  console.error = (...args: unknown[]): void => {
    originalError(...args)
    const { message, details } = describe(args)
    addLog('error', 'main', message, details)
  }

  console.warn = (...args: unknown[]): void => {
    originalWarn(...args)
    const { message, details } = describe(args)
    addLog('warn', 'main', message, details)
  }

  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err)
  })

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason)
  })
}
