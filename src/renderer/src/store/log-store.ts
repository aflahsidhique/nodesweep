import { create } from 'zustand'
import type { LogEntry } from '@shared/types'

interface LogState {
  logs: LogEntry[]
  unseenErrors: number
  isConsoleOpen: boolean

  initLogs: () => Promise<void>
  openConsole: () => void
  closeConsole: () => void
  clearLogs: () => Promise<void>
}

let unsubscribe: (() => void) | null = null

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  unseenErrors: 0,
  isConsoleOpen: false,

  initLogs: async () => {
    if (unsubscribe) return
    unsubscribe = window.nodeSweep.onLogEntry((entry) => {
      set((state) => ({
        logs: [...state.logs, entry],
        unseenErrors:
          !state.isConsoleOpen && entry.level === 'error'
            ? state.unseenErrors + 1
            : state.unseenErrors
      }))
    })
    const existing = await window.nodeSweep.getLogs()
    const known = new Set(existing.map((e) => e.id))
    set((state) => {
      const live = state.logs.filter((e) => !known.has(e.id))
      const logs = [...existing, ...live]
      return {
        logs,
        unseenErrors: state.isConsoleOpen ? 0 : logs.filter((e) => e.level === 'error').length
      }
    })
  },

  openConsole: () => set({ isConsoleOpen: true, unseenErrors: 0 }),

  closeConsole: () => set({ isConsoleOpen: false }),

  clearLogs: async () => {
    await window.nodeSweep.clearLogs()
    set({ logs: [], unseenErrors: 0 })
  }
}))
