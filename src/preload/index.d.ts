import type { NodeSweepApi } from './index'

declare global {
  interface Window {
    nodeSweep: NodeSweepApi
  }
}
