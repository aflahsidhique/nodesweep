import { promises as fs } from 'fs'
import type { DeleteResult, ScanCandidate } from '@shared/types'
import { validateDeletionTarget } from '../security/path-validator'

export async function deleteCandidates(
  candidates: ScanCandidate[],
  allowedRoots: string[]
): Promise<DeleteResult[]> {
  const results: DeleteResult[] = []

  for (const candidate of candidates) {
    const validation = validateDeletionTarget(candidate.nodeModulesPath, allowedRoots)
    if (!validation.valid) {
      results.push({
        id: candidate.id,
        path: candidate.nodeModulesPath,
        success: false,
        bytesFreed: 0,
        error: validation.reason
      })
      continue
    }

    try {
      await fs.rm(candidate.nodeModulesPath, { recursive: true, force: true })
      results.push({
        id: candidate.id,
        path: candidate.nodeModulesPath,
        success: true,
        bytesFreed: candidate.sizeBytes
      })
    } catch (err) {
      results.push({
        id: candidate.id,
        path: candidate.nodeModulesPath,
        success: false,
        bytesFreed: 0,
        error: err instanceof Error ? err.message : String(err)
      })
    }
  }

  return results
}
