import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown, Search, Trash2 } from 'lucide-react'
import { useAppStore } from '@renderer/store/app-store'
import { formatBytes } from '@renderer/lib/format'
import { cn } from '@renderer/lib/utils'
import { Checkbox } from './Checkbox'
import { Button } from './Button'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'
import type { CandidateStatus, ScanCandidate } from '@shared/types'

const STATUS_STYLES: Record<CandidateStatus, string> = {
  candidate: 'bg-red-50 text-red-600',
  recent: 'bg-emerald-50 text-emerald-600',
  error: 'bg-slate-100 text-slate-500'
}

const STATUS_LABEL: Record<CandidateStatus, string> = {
  candidate: 'Unused',
  recent: 'Recent',
  error: 'Error'
}

type StatusFilter = 'all' | CandidateStatus
type SortField = 'name' | 'size' | 'age'
type SortDirection = 'asc' | 'desc'

interface SortHeaderProps {
  field: SortField
  label: string
  align?: 'left' | 'right'
  activeField: SortField
  direction: SortDirection
  onSort: (field: SortField) => void
}

function SortHeader({ field, label, align = 'left', activeField, direction, onSort }: SortHeaderProps): JSX.Element {
  const isActive = activeField === field
  const Icon = isActive ? (direction === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        'flex items-center gap-1 text-xs font-medium uppercase tracking-wide',
        align === 'right' && 'flex-row-reverse',
        isActive ? 'text-slate-700' : 'text-slate-400 hover:text-slate-600'
      )}
    >
      {label}
      <Icon className="h-3 w-3" />
    </button>
  )
}

export function ResultsTable(): JSX.Element | null {
  const { scanSummary, selectedIds, deletingIds, toggleSelected, selectAllCandidates, clearSelection } =
    useAppStore()
  const [confirming, setConfirming] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortField, setSortField] = useState<SortField>('size')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const candidates = useMemo(() => scanSummary?.candidates ?? [], [scanSummary])

  const counts = useMemo(
    () => ({
      all: candidates.length,
      candidate: candidates.filter((c) => c.status === 'candidate').length,
      recent: candidates.filter((c) => c.status === 'recent').length,
      error: candidates.filter((c) => c.status === 'error').length
    }),
    [candidates]
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return candidates.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (term && !`${c.projectName} ${c.projectPath}`.toLowerCase().includes(term)) return false
      return true
    })
  }, [candidates, search, statusFilter])

  const sorted = useMemo(() => {
    const compare = (a: ScanCandidate, b: ScanCandidate): number => {
      if (sortField === 'name') return a.projectName.localeCompare(b.projectName)
      if (sortField === 'size') return a.sizeBytes - b.sizeBytes
      return a.ageDays - b.ageDays
    }
    const copy = [...filtered].sort(compare)
    return sortDirection === 'asc' ? copy : copy.reverse()
  }, [filtered, sortField, sortDirection])

  if (candidates.length === 0) return null

  const handleSort = (field: SortField): void => {
    if (field === sortField) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection(field === 'name' ? 'asc' : 'desc')
    }
  }

  const selectableVisible = filtered.filter((c) => c.status !== 'error')
  const allVisibleSelected =
    selectableVisible.length > 0 && selectableVisible.every((c) => selectedIds.has(c.id))
  const selectedCandidates = candidates.filter((c) => selectedIds.has(c.id))
  const selectedBytes = selectedCandidates.reduce((sum, c) => sum + c.sizeBytes, 0)

  const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'candidate', label: 'Unused', count: counts.candidate },
    { key: 'recent', label: 'Recent', count: counts.recent }
  ]
  if (counts.error > 0) filterTabs.push({ key: 'error', label: 'Error', count: counts.error })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">
          Found node_modules (
          {filtered.length === candidates.length ? candidates.length : `${filtered.length} of ${candidates.length}`}
          )
        </span>
        <button
          type="button"
          onClick={() =>
            allVisibleSelected
              ? clearSelection()
              : selectAllCandidates(selectableVisible.map((c) => c.id))
          }
          className="text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          {allVisibleSelected ? 'Clear selection' : 'Select all visible'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                statusFilter === tab.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.label} {tab.count}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
        {sorted.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">
            No projects match your search or filter.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="w-10 px-3 py-2" />
                <th className="px-2 py-2">
                  <SortHeader
                    field="name"
                    label="Project"
                    activeField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-2 py-2">
                  <SortHeader
                    field="size"
                    label="Size"
                    activeField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-2 py-2">
                  <SortHeader
                    field="age"
                    label="Unused for"
                    activeField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((candidate) => {
                const isDeleting = deletingIds.has(candidate.id)
                return (
                <tr
                  key={candidate.id}
                  className={cn(
                    'border-b border-slate-100 pointer-events-auto last:border-0 transition-all duration-300',
                    isDeleting
                      ? 'scale-[0.99] bg-red-50/40 opacity-40 pointer-events-none'
                      : 'hover:bg-slate-50'
                  )}
                >
                  <td className="w-10 px-3 py-2.5">
                    {isDeleting ? (
                      <Trash2 className="h-4 w-4 animate-pulse text-red-400" />
                    ) : (
                      candidate.status !== 'error' && (
                        <Checkbox
                          checked={selectedIds.has(candidate.id)}
                          onChange={() => toggleSelected(candidate.id)}
                          label=""
                        />
                      )
                    )}
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="truncate font-medium text-slate-800" title={candidate.projectPath}>
                      {candidate.projectName}
                    </div>
                    <div
                      className="truncate font-mono text-xs text-slate-400"
                      title={candidate.projectPath}
                    >
                      {candidate.projectPath}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-slate-600">
                    {formatBytes(candidate.sizeBytes)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-slate-500">
                    {candidate.ageDays}d
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        STATUS_STYLES[candidate.status]
                      )}
                    >
                      {STATUS_LABEL[candidate.status]}
                    </span>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedCandidates.length > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-600">
            {selectedCandidates.length} selected &middot; {formatBytes(selectedBytes)} to be deleted
          </span>
          <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => setConfirming(true)}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete Selected
          </Button>
        </div>
      )}

      {confirming && (
        <ConfirmDeleteDialog candidates={selectedCandidates} onClose={() => setConfirming(false)} />
      )}
    </div>
  )
}
