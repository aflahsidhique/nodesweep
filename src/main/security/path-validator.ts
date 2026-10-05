import { existsSync, statSync } from 'fs'
import { basename, isAbsolute, relative } from 'path'

export interface ValidationResult {
  valid: boolean
  reason?: string
}

function isInsideRoot(target: string, root: string): boolean {
  const rel = relative(root, target)
  return rel !== '' && rel !== '.' && !rel.startsWith('..') && !isAbsolute(rel)
}

/**
 * Guards against deleting anything other than a node_modules directory that
 * actually lives inside one of the folders/drives the user explicitly chose
 * to scan. This is the only gate between the renderer and the filesystem.
 */
export function validateDeletionTarget(targetPath: string, allowedRoots: string[]): ValidationResult {
  if (!isAbsolute(targetPath)) {
    return { valid: false, reason: 'Path is not absolute.' }
  }
  if (basename(targetPath) !== 'node_modules') {
    return { valid: false, reason: 'Target is not a node_modules directory.' }
  }
  if (!allowedRoots.some((root) => isInsideRoot(targetPath, root))) {
    return { valid: false, reason: 'Target is outside the configured scan roots.' }
  }
  if (!existsSync(targetPath)) {
    return { valid: false, reason: 'Path no longer exists.' }
  }
  try {
    if (!statSync(targetPath).isDirectory()) {
      return { valid: false, reason: 'Target is not a directory.' }
    }
  } catch (err) {
    return { valid: false, reason: err instanceof Error ? err.message : 'Unable to read path.' }
  }
  return { valid: true }
}
