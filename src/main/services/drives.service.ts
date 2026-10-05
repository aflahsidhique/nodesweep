import { existsSync } from 'fs'
import type { DriveInfo } from '@shared/types'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function listDrives(): DriveInfo[] {
  return LETTERS.map((letter) => `${letter}:\\`)
    .filter((root) => existsSync(root))
    .map((root) => ({ letter: root, label: root }))
}
