import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { formatBytes } from '@renderer/lib/format'
import { useAppStore } from '@renderer/store/app-store'
import type { ScanCandidate } from '@shared/types'

interface ConfirmDeleteDialogProps {
  candidates: ScanCandidate[]
  onClose: () => void
}

export function ConfirmDeleteDialog({ candidates, onClose }: ConfirmDeleteDialogProps): JSX.Element {
  const { deleteSelected } = useAppStore()
  const totalBytes = candidates.reduce((sum, c) => sum + c.sizeBytes, 0)

  // Deletion runs in the background so the dialog closes immediately and the
  // affected rows can animate out in the table instead of behind an overlay.
  const handleDelete = (): void => {
    void deleteSelected()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Delete {candidates.length} node_modules folder{candidates.length === 1 ? '' : 's'}?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              This will permanently remove them from your computer.
            </p>
          </div>
        </div>

        <div className="mt-4 max-h-40 overflow-y-auto rounded-lg bg-slate-50 p-3">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="flex items-center justify-between py-1 text-sm">
              <span className="truncate text-slate-700">{candidate.projectName}</span>
              <span className="ml-3 shrink-0 text-slate-400">{formatBytes(candidate.sizeBytes)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
          <span>Total</span>
          <span>{formatBytes(totalBytes)}</span>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
            Delete {formatBytes(totalBytes)}
          </Button>
        </div>
      </div>
    </div>
  )
}
