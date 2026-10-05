import { existsSync } from 'fs'
import type { DriveInfo } from '@shared/types'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/**
 * Enumerates fixed drive letters by probing the filesystem directly
 * (no shell/process spawning) so there is nothing here that can be
 * abused as a command-injection vector.
 */
export function listDrives(): DriveInfo[] {
  return LETTERS.map((letter) => `${letter}:\\`)
    .filter((root) => existsSync(root))
    .map((root) => ({ letter: root, label: root }))
}
