import { useEffect, useState } from 'react'
import { Folder, HardDrive } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { Button } from './Button'
import { useAppStore } from '@renderer/store/app-store'
import type { DriveInfo } from '@shared/types'

export function SourceSelector(): JSX.Element {
  const { selectionMode, setSelectionMode, settings, chooseFolder, chooseDrive } = useAppStore()
  const [drives, setDrives] = useState<DriveInfo[]>([])
  const selectedRoot = settings?.roots[0] ?? ''

  useEffect(() => {
    if (selectionMode === 'drive' && drives.length === 0) {
      window.nodeSweep.listDrives().then(setDrives)
    }
  }, [selectionMode, drives.length])

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setSelectionMode('folder')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-medium transition-colors',
            selectionMode === 'folder'
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
          )}
        >
          <Folder className="h-4 w-4" />
          Select Folder
        </button>
        <button
          type="button"
          onClick={() => setSelectionMode('drive')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-medium transition-colors',
            selectionMode === 'drive'
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
          )}
        >
          <HardDrive className="h-4 w-4" />
          Select Drive
        </button>
      </div>

      {selectionMode === 'folder' ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <span className="truncate text-sm text-slate-700">{selectedRoot || 'No folder selected'}</span>
          <Button variant="secondary" size="sm" onClick={chooseFolder}>
            Change
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 rounded-xl bg-slate-50 px-4 py-3">
          {drives.length === 0 && <span className="text-sm text-slate-400">Loading drives…</span>}
          {drives.map((drive) => (
            <button
              key={drive.letter}
              type="button"
              onClick={() => chooseDrive(drive.letter)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm',
                selectedRoot === drive.letter
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              )}
            >
              {drive.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
