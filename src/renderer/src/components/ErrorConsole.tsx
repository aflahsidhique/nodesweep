import { useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, Check, Copy, Trash2, X } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@renderer/lib/utils'
import { useLogStore } from '@renderer/store/log-store'
import type { LogEntry } from '@shared/types'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatEntry(entry: LogEntry): string {
  const line = `[${entry.timestamp}] ${entry.level.toUpperCase()} (${entry.source}) ${entry.message}`
  return entry.details ? `${line}\n${entry.details}` : line
}

function LogRow({ entry }: { entry: LogEntry }): JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const isError = entry.level === 'error'
  const Icon = isError ? AlertCircle : AlertTriangle

  return (
    <div className="border-b border-slate-100 px-5 py-2.5 last:border-b-0">
      <div className="flex items-start gap-2.5">
        <Icon
          className={cn('mt-0.5 h-4 w-4 shrink-0', isError ? 'text-red-500' : 'text-amber-500')}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{formatTime(entry.timestamp)}</span>
            <span className="rounded bg-slate-100 px-1.5 py-px font-medium text-slate-500">
              {entry.source}
            </span>
          </div>
          <p className="mt-0.5 break-words font-mono text-xs text-slate-700">{entry.message}</p>
          {entry.details && (
            <>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 text-xs font-medium text-slate-400 hover:text-slate-600"
              >
                {expanded ? 'Hide details' : 'Show details'}
              </button>
              {expanded && (
                <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-50 p-2 font-mono text-[11px] text-slate-500">
                  {entry.details}
                </pre>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function ErrorConsole(): JSX.Element {
  const { logs, closeConsole, clearLogs } = useLogStore()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') closeConsole()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeConsole])

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(logs.map(formatEntry).join('\n\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const errorCount = logs.filter((e) => e.level === 'error').length
  const warnCount = logs.length - errorCount

  return (
    <div
      className="no-drag fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6"
      onClick={closeConsole}
    >
      <div
        role="dialog"
        aria-label="Error console"
        className="flex max-h-full w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Error console</h2>
            <p className="text-xs text-slate-400">
              {errorCount} {errorCount === 1 ? 'error' : 'errors'}, {warnCount}{' '}
              {warnCount === 1 ? 'warning' : 'warnings'} this session
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={closeConsole}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-[12rem] flex-1 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-slate-400">
              <Check className="h-5 w-5 text-brand-500" />
              No errors logged.
            </div>
          ) : (
            [...logs].reverse().map((entry) => <LogRow key={entry.id} entry={entry} />)
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <Button variant="ghost" size="sm" onClick={handleCopy} disabled={logs.length === 0}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy all'}
          </Button>
          <Button variant="secondary" size="sm" onClick={clearLogs} disabled={logs.length === 0}>
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  )
}
