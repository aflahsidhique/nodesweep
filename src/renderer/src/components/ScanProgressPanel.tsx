import { FolderSearch, HardDriveDownload } from 'lucide-react'
import type { ScanProgress } from '@shared/types'

export function ScanProgressPanel({ progress }: { progress: ScanProgress | null }): JSX.Element | null {
  if (!progress || progress.phase === 'done') return null

  const isSizing = progress.phase === 'sizing'
  const Icon = isSizing ? HardDriveDownload : FolderSearch

  return (
    <div className="flex flex-col gap-1 rounded-xl bg-slate-50 px-4 py-3">
      <div className="flex items-center justify-between text-xs font-medium text-slate-600">
        <span className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-brand-600" />
          {isSizing ? 'Calculating sizes…' : 'Searching for node_modules…'}
        </span>
        <span className="text-slate-400">{progress.nodeModulesFound} found</span>
      </div>
      {progress.currentPath && (
        <div className="truncate font-mono text-xs text-slate-400" title={progress.currentPath}>
          {progress.currentPath}
        </div>
      )}
    </div>
  )
}
