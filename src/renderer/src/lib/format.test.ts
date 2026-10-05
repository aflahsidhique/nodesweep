import { describe, expect, it } from 'vitest'
import { formatBytes } from './format'

describe('formatBytes', () => {
  it('formats zero and negative values as 0 MB', () => {
    expect(formatBytes(0)).toBe('0 MB')
    expect(formatBytes(-10)).toBe('0 MB')
  })

  it('formats megabytes and gigabytes', () => {
    expect(formatBytes(100 * 1024 * 1024)).toBe('100.0 MB')
    expect(formatBytes(6.4 * 1024 * 1024 * 1024)).toBe('6.4 GB')
  })
})
