import { describe, expect, it } from 'vitest'

import {
  appSettingsStore,
  generationStore,
  navigationStore,
  resetAllStores,
  type RunState,
} from '@/lib/stores'

// Each store is exposed as its own namespace off the lib/stores index. A deep
// import of a raw handle is asserted by public-api-surfaces.test.ts (boundaries
// lint) and public-api.typecheck.ts.
describe('lib/stores public surface', () => {
  it('exposes the generation selector + mutators', () => {
    expect(typeof generationStore.useGeneration).toBe('function')
    expect(typeof generationStore.startRun).toBe('function')
    expect(typeof generationStore.finishRun).toBe('function')
  })

  it('exposes the app-settings read-model selectors', () => {
    expect(typeof appSettingsStore.useAppSettings).toBe('function')
    expect(typeof appSettingsStore.getAppSettings).toBe('function')
  })

  it('exposes the navigation selectors + mutators', () => {
    expect(typeof navigationStore.useNavigation).toBe('function')
    expect(typeof navigationStore.setCurrentStory).toBe('function')
    expect(typeof navigationStore.setCurrentBranch).toBe('function')
  })

  it('resetAllStores clears every store', () => {
    const run: RunState = {
      runId: 'r1',
      kind: 'synthetic',
      actionId: 'a1',
      storyId: null,
      branchId: 'b1',
      abortController: new AbortController(),
      currentPhase: '',
      intermediates: {},
      terminal: Promise.resolve(),
      resolveTerminal: () => {},
    }
    generationStore.startRun(run)
    navigationStore.setCurrentStory('s1')

    resetAllStores()

    expect(generationStore.getTxState().runs.size).toBe(0)
    expect(navigationStore.getNavigation().currentStoryId).toBeNull()
    expect(appSettingsStore.getAppSettings()).toEqual({
      providers: [],
      profiles: [],
      assignments: {},
      defaultProviderId: null,
      diagnostics: { enabled: false, debug_level_enabled: false },
    })
  })
})
