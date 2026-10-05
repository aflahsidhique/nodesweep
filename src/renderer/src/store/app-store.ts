import { create } from 'zustand'
import type { AppSettings, DeleteResult, ScanProgress, ScanSummary } from '@shared/types'

type SelectionMode = 'folder' | 'drive'

interface AppState {
  settings: AppSettings | null
  scanSummary: ScanSummary | null
  isScanning: boolean
  progress: ScanProgress | null
  selectionMode: SelectionMode
  error: string | null

  selectedIds: Set<string>
  isDeleting: boolean
  deletingIds: Set<string>

  loadSettings: () => Promise<void>
  chooseFolder: () => Promise<void>
  chooseDrive: (drivePath: string) => Promise<void>
  setSelectionMode: (mode: SelectionMode) => void
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
  runScan: () => Promise<void>
  cancelScan: () => void

  toggleSelected: (id: string) => void
  selectAllCandidates: (ids?: string[]) => void
  clearSelection: () => void
  deleteSelected: () => Promise<DeleteResult[]>
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: null,
  scanSummary: null,
  isScanning: false,
  progress: null,
  selectionMode: 'folder',
  error: null,
  selectedIds: new Set(),
  isDeleting: false,
  deletingIds: new Set(),

  loadSettings: async () => {
    const settings = await window.nodeSweep.getSettings()
    set({ settings, scanSummary: settings.lastScan ?? null })

    window.nodeSweep.onScanProgress((progress) => {
      set({ progress })
    })
  },

  chooseFolder: async () => {
    const folder = await window.nodeSweep.selectFolder()
    if (!folder) return
    await get().updateSettings({ roots: [folder] })
  },

  chooseDrive: async (drivePath: string) => {
    await get().updateSettings({ roots: [drivePath] })
  },

  setSelectionMode: (mode) => set({ selectionMode: mode }),

  updateSettings: async (partial) => {
    const settings = await window.nodeSweep.updateSettings(partial)
    set({ settings })
  },

  runScan: async () => {
    const { settings } = get()
    if (!settings || settings.roots.length === 0) {
      set({ error: 'Select a folder or drive to scan first.' })
      return
    }
    set({ isScanning: true, error: null, progress: null, selectedIds: new Set() })
    try {
      const summary = await window.nodeSweep.scan({
        roots: settings.roots,
        inactivityDays: settings.inactivityDays,
        minSizeBytes: settings.minSizeMB * 1024 * 1024,
        includeSubdirectories: settings.includeSubdirectories,
        detectGitActivity: settings.detectGitActivity
      })
      set({ scanSummary: summary })
    } catch (err) {
      console.error('Scan failed:', err)
      set({ error: err instanceof Error ? err.message : 'Scan failed.' })
    } finally {
      set({ isScanning: false, progress: null })
    }
  },

  cancelScan: () => {
    window.nodeSweep.cancelScan()
  },

  toggleSelected: (id) => {
    const next = new Set(get().selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    set({ selectedIds: next })
  },

  selectAllCandidates: (ids) => {
    if (ids) {
      set({ selectedIds: new Set(ids) })
      return
    }
    const candidates = get().scanSummary?.candidates ?? []
    set({ selectedIds: new Set(candidates.filter((c) => c.status !== 'error').map((c) => c.id)) })
  },

  clearSelection: () => set({ selectedIds: new Set() }),

  deleteSelected: async () => {
    const { scanSummary, selectedIds } = get()
    if (!scanSummary || selectedIds.size === 0) return []

    const targets = scanSummary.candidates.filter((c) => selectedIds.has(c.id))
    set({ isDeleting: true, error: null, deletingIds: new Set(selectedIds), selectedIds: new Set() })
    try {
      const results = await window.nodeSweep.deleteCandidates(targets)
      const deletedIds = new Set(results.filter((r) => r.success).map((r) => r.id))
      const failed = results.filter((r) => !r.success)

      await new Promise((resolve) => setTimeout(resolve, 300))

      const remaining = scanSummary.candidates.filter((c) => !deletedIds.has(c.id))
      const unused = remaining.filter((c) => c.status === 'candidate')

      set({
        scanSummary: {
          ...scanSummary,
          candidates: remaining,
          projectsScanned: remaining.length,
          unusedCount: unused.length,
          reclaimableBytes: unused.reduce((sum, c) => sum + c.sizeBytes, 0)
        },
        deletingIds: new Set(),
        error: failed.length > 0 ? `Failed to delete ${failed.length} item(s). Open the error console (settings icon) for details.` : null
      })
      return results
    } catch (err) {
      console.error('Deletion failed:', err)
      set({ error: err instanceof Error ? err.message : 'Deletion failed.', deletingIds: new Set() })
      return []
    } finally {
      set({ isDeleting: false })
    }
  }
}))
