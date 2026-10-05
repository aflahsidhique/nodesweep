import { useEffect } from 'react'
import { Loader2, Play } from 'lucide-react'
import appIcon from './assets/icon.png'
import { TitleBar } from './components/TitleBar'
import { SourceSelector } from './components/SourceSelector'
import { FieldSelect } from './components/FieldSelect'
import { Checkbox } from './components/Checkbox'
import { Button } from './components/Button'
import { StatsBar } from './components/StatsBar'
import { ResultsTable } from './components/ResultsTable'
import { ScanProgressPanel } from './components/ScanProgressPanel'
import { useAppStore } from './store/app-store'
import { formatBytes, formatRelativeTime } from './lib/format'

const INACTIVITY_OPTIONS = [
  { label: '7 days', value: '7' },
  { label: '14 days', value: '14' },
  { label: '30 days', value: '30' },
  { label: '60 days', value: '60' }
]

const MIN_SIZE_OPTIONS = [
  { label: '50 MB', value: '50' },
  { label: '100 MB', value: '100' },
  { label: '250 MB', value: '250' },
  { label: '500 MB', value: '500' },
  { label: '1 GB', value: '1024' }
]

function App(): JSX.Element {
  const {
    settings,
    scanSummary,
    isScanning,
    progress,
    error,
    loadSettings,
    updateSettings,
    runScan
  } = useAppStore()

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  if (!settings) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
      </div>
    )
  }

  const stats = [
    { value: String(scanSummary?.projectsScanned ?? 0), label: 'Projects' },
    { value: String(scanSummary?.unusedCount ?? 0), label: 'Unused' },
    { value: formatBytes(scanSummary?.reclaimableBytes ?? 0), label: 'Can be cleaned' },
    {
      value: scanSummary ? formatRelativeTime(scanSummary.scannedAt) : '—',
      label: 'Last scan'
    }
  ]

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <TitleBar />

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        <SourceSelector />

        <div className="grid grid-cols-2 gap-4">
          <FieldSelect
            label="Delete if unused for"
            value={String(settings.inactivityDays)}
            onChange={(v) => updateSettings({ inactivityDays: Number(v) })}
            options={INACTIVITY_OPTIONS}
          />
          <FieldSelect
            label="Minimum size"
            value={String(settings.minSizeMB)}
            onChange={(v) => updateSettings({ minSizeMB: Number(v) })}
            options={MIN_SIZE_OPTIONS}
          />
        </div>

        <div className="flex items-center gap-8">
          <Checkbox
            checked={settings.includeSubdirectories}
            onChange={(checked) => updateSettings({ includeSubdirectories: checked })}
            label="Include subdirectories"
          />
          <Checkbox
            checked={settings.detectGitActivity}
            onChange={(checked) => updateSettings({ detectGitActivity: checked })}
            label="Detect Git activity (if available)"
          />
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={runScan}
          disabled={isScanning}
        >
          {isScanning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {progress?.phase === 'sizing' ? 'Calculating sizes…' : 'Scanning…'}
            </>
          ) : (
            <>
              <Play className="h-4 w-4" fill="currentColor" />
              Scan
            </>
          )}
        </Button>

        {isScanning && <ScanProgressPanel progress={progress} />}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <StatsBar stats={stats} />

        <ResultsTable />
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-xs text-slate-400">
        <span>v1.0.0</span>
        <span className="flex items-center gap-1.5">
          A cleaner dev environment
          <img src={appIcon} alt="" className="h-3.5 w-3.5" draggable={false} />
        </span>
      </div>
    </div>
  )
}

export default App
