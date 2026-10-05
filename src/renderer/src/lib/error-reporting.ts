function stringify(value: unknown): string {
  if (value instanceof Error) return value.message
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function report(level: 'error' | 'warn', args: unknown[]): void {
  const error = args.find((a): a is Error => a instanceof Error)
  try {
    window.nodeSweep.reportLog({
      level,
      message: args.map(stringify).join(' '),
      details: error?.stack
    })
  } catch {}
}

export function installRendererErrorReporting(): void {
  const originalError = console.error.bind(console)
  const originalWarn = console.warn.bind(console)

  console.error = (...args: unknown[]): void => {
    originalError(...args)
    report('error', args)
  }

  console.warn = (...args: unknown[]): void => {
    originalWarn(...args)
    report('warn', args)
  }

  window.addEventListener('error', (event) => {
    report('error', [event.error ?? event.message])
  })

  window.addEventListener('unhandledrejection', (event) => {
    report('error', ['Unhandled promise rejection:', event.reason])
  })
}
