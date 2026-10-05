import { useEffect } from 'react'
import { Minus, Settings, X } from 'lucide-react'
import appIcon from '@renderer/assets/icon.png'
import { useLogStore } from '@renderer/store/log-store'
import { ErrorConsole } from './ErrorConsole'

export function TitleBar(): JSX.Element {
  const { unseenErrors, isConsoleOpen, initLogs, openConsole } = useLogStore()

  useEffect(() => {
    initLogs()
  }, [initLogs])

  return (
    <div className="drag-region flex items-start justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-start gap-3">
        <img src={appIcon} alt="" className="mt-0.5 h-7 w-7 shrink-0" draggable={false} />
        <div>
          <h1 className="text-lg font-semibold leading-tight text-slate-900">NodeSweep</h1>
          <p className="text-sm text-slate-400">Clean unused node_modules. Keep what matters.</p>
        </div>
      </div>
      <div className="no-drag flex items-center gap-1">
        <button
          type="button"
          aria-label={unseenErrors > 0 ? `Error console (${unseenErrors} new)` : 'Error console'}
          title="Error console"
          onClick={openConsole}
          className="relative rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <Settings className="h-4 w-4" />
          {unseenErrors > 0 && (
            <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>
        <button
          type="button"
          aria-label="Minimize"
          onClick={() => window.nodeSweep.minimizeWindow()}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Close"
          onClick={() => window.nodeSweep.closeWindow()}
          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {isConsoleOpen && <ErrorConsole />}
    </div>
  )
}
