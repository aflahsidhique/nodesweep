export type CandidateStatus = 'candidate' | 'recent' | 'error'

export interface ScanOptions {
  roots: string[]
  inactivityDays: number
  minSizeBytes: number
  includeSubdirectories: boolean
  detectGitActivity: boolean
}

export interface ScanCandidate {
  id: string
  projectName: string
  projectPath: string
  nodeModulesPath: string
  sizeBytes: number
  lastActivityAt: string
  ageDays: number
  status: CandidateStatus
  error?: string
}

export interface ScanSummary {
  projectsScanned: number
  unusedCount: number
  reclaimableBytes: number
  scannedAt: string
  candidates: ScanCandidate[]
}

export interface AppSettings {
  roots: string[]
  inactivityDays: number
  minSizeMB: number
  includeSubdirectories: boolean
  detectGitActivity: boolean
  lastScan?: ScanSummary
}

export interface DriveInfo {
  letter: string
  label: string
}

export type ScanProgress =
  | { phase: 'discovering'; projectsFound: number; nodeModulesFound: number; currentPath: string }
  | { phase: 'sizing'; projectsFound: number; nodeModulesFound: number; currentPath: string }
  | { phase: 'done' }

export interface DeleteResult {
  id: string
  path: string
  success: boolean
  bytesFreed: number
  error?: string
}

export type LogLevel = 'error' | 'warn'
export type LogSource = 'main' | 'renderer'

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  source: LogSource
  message: string
  details?: string
}
