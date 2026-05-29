import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { diagnosticsStore } from './store'
import { hydrateDiagnostics } from './use-diagnostics-hydration'

describe('hydrateDiagnostics', () => {
  beforeEach(() => diagnosticsStore.getState().__reset())
  afterEach(() => vi.unstubAllGlobals())

  it('sets the master gate ON from settings', async () => {
    await hydrateDiagnostics(async () => ({ enabled: true, debug_level_enabled: false }))
    expect(diagnosticsStore.getState().enabled).toBe(true)
    expect(diagnosticsStore.getState().debugEnabled).toBe(false)
  })

  it('sets the debug-level gate from settings', async () => {
    await hydrateDiagnostics(async () => ({ enabled: true, debug_level_enabled: true }))
    expect(diagnosticsStore.getState().debugEnabled).toBe(true)
  })

  it('defaults the gate OFF when the settings row is missing', async () => {
    await hydrateDiagnostics(async () => undefined)
    expect(diagnosticsStore.getState().enabled).toBe(false)
    expect(diagnosticsStore.getState().debugEnabled).toBe(false)
  })

  it('forces the gate ON in a dev build regardless of stored settings', async () => {
    vi.stubGlobal('__DEV__', true)
    await hydrateDiagnostics(async () => ({ enabled: false, debug_level_enabled: false }))
    expect(diagnosticsStore.getState().enabled).toBe(true)
  })
})
