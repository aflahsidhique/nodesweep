import { promises as fs, type Dirent } from 'fs'
import { join, basename, dirname } from 'path'
import { randomUUID } from 'crypto'
import type { ScanOptions, ScanCandidate, ScanSummary, ScanProgress } from '@shared/types'

const IGNORED_DIR_NAMES = new Set([
  '.git',
  '.next',
  '.nuxt',
  'dist',
  'build',
  'coverage',
  '.cache',
  '.turbo',
  '.vite',
  '.parcel-cache',
  '.output'
])

const ACTIVITY_FILES = ['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']

const CONCURRENCY = 8

export interface ScanController {
  cancelled: boolean
}

const PROGRESS_THROTTLE_MS = 80

export async function scanRoots(
  options: ScanOptions,
  controller: ScanController,
  onProgress: (progress: ScanProgress) => void
): Promise<ScanSummary> {
  const nodeModulesPaths: string[] = []
  let lastEmitAt = 0

  function emitProgress(
    phase: 'discovering' | 'sizing',
    currentPath: string,
    force = false
  ): void {
    const now = Date.now()
    if (!force && now - lastEmitAt < PROGRESS_THROTTLE_MS) return
    lastEmitAt = now
    onProgress({
      phase,
      projectsFound: nodeModulesPaths.length,
      nodeModulesFound: nodeModulesPaths.length,
      currentPath
    })
  }

  async function discover(dir: string, depth: number): Promise<void> {
    if (controller.cancelled) return
    emitProgress('discovering', dir)
    let entries: Dirent[]
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (controller.cancelled) return
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue
      if (entry.name === 'node_modules') {
        nodeModulesPaths.push(join(dir, entry.name))
        emitProgress('discovering', dir, true)
        continue
      }
      if (IGNORED_DIR_NAMES.has(entry.name)) continue
      if (depth === 0 || options.includeSubdirectories) {
        await discover(join(dir, entry.name), depth + 1)
      }
    }
  }

  for (const root of options.roots) {
    await discover(root, 0)
  }

  const candidates: ScanCandidate[] = []
  emitProgress('sizing', '', true)

  await runWithConcurrency(nodeModulesPaths, CONCURRENCY, async (nodeModulesPath) => {
    if (controller.cancelled) return
    const projectPath = dirname(nodeModulesPath)
    emitProgress('sizing', projectPath)
    try {
      const [sizeBytes, lastActivityAt] = await Promise.all([
        directorySize(nodeModulesPath, controller),
        lastActivity(projectPath, options.detectGitActivity)
      ])
      const ageDays = Math.floor((Date.now() - lastActivityAt.getTime()) / 86_400_000)
      const meetsSize = sizeBytes >= options.minSizeBytes
      const meetsAge = ageDays >= options.inactivityDays
      candidates.push({
        id: randomUUID(),
        projectName: basename(projectPath),
        projectPath,
        nodeModulesPath,
        sizeBytes,
        lastActivityAt: lastActivityAt.toISOString(),
        ageDays,
        status: meetsSize && meetsAge ? 'candidate' : 'recent'
      })
    } catch (err) {
      console.warn(`Could not analyze ${nodeModulesPath}:`, err)
      candidates.push({
        id: randomUUID(),
        projectName: basename(projectPath),
        projectPath,
        nodeModulesPath,
        sizeBytes: 0,
        lastActivityAt: new Date(0).toISOString(),
        ageDays: 0,
        status: 'error',
        error: err instanceof Error ? err.message : String(err)
      })
    }
  })

  onProgress({ phase: 'done' })

  const unusedCandidates = candidates.filter((c) => c.status === 'candidate')
  return {
    projectsScanned: candidates.length,
    unusedCount: unusedCandidates.length,
    reclaimableBytes: unusedCandidates.reduce((sum, c) => sum + c.sizeBytes, 0),
    scannedAt: new Date().toISOString(),
    candidates: candidates.sort((a, b) => b.sizeBytes - a.sizeBytes)
  }
}

async function directorySize(dir: string, controller: ScanController): Promise<number> {
  let total = 0

  async function walk(current: string): Promise<void> {
    if (controller.cancelled) return
    let entries: Dirent[]
    try {
      entries = await fs.readdir(current, { withFileTypes: true })
    } catch {
      return
    }
    await runWithConcurrency(entries, CONCURRENCY, async (entry) => {
      if (controller.cancelled || entry.isSymbolicLink()) return
      const full = join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
      } else if (entry.isFile()) {
        try {
          const stat = await fs.stat(full)
          total += stat.size
        } catch {
          // file may have been removed or locked mid-scan; skip it
        }
      }
    })
  }

  await walk(dir)
  return total
}

async function lastActivity(projectPath: string, detectGitActivity: boolean): Promise<Date> {
  const candidateTimes: number[] = []

  for (const file of ACTIVITY_FILES) {
    try {
      const stat = await fs.stat(join(projectPath, file))
      candidateTimes.push(stat.mtimeMs)
    } catch {
      // file not present in this project
    }
  }

  if (detectGitActivity) {
    try {
      // Reading .git/HEAD's mtime avoids spawning a git process per project.
      const stat = await fs.stat(join(projectPath, '.git', 'HEAD'))
      candidateTimes.push(stat.mtimeMs)
    } catch {
      // not a git repository
    }
  }

  if (candidateTimes.length === 0) {
    try {
      const stat = await fs.stat(projectPath)
      candidateTimes.push(stat.mtimeMs)
    } catch {
      candidateTimes.push(Date.now())
    }
  }

  return new Date(Math.max(...candidateTimes))
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>
): Promise<void> {
  let index = 0
  async function worker(): Promise<void> {
    while (index < items.length) {
      const current = items[index++]
      await task(current)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
}
