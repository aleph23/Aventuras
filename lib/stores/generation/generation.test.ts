import { beforeEach, describe, expect, it } from 'vitest'

import { generationStore, type RunState } from './generation'

function run(id: string, kind = 'synthetic'): RunState {
  return {
    runId: id,
    kind,
    actionId: `act_${id}`,
    storyId: 's1',
    branchId: 'b1',
    abortController: new AbortController(),
    currentPhase: '',
    intermediates: {},
    terminal: Promise.resolve(),
    resolveTerminal: () => {},
  }
}

describe('generation store', () => {
  beforeEach(() => generationStore.__reset())

  it('startRun adds, abortRun removes', () => {
    generationStore.startRun(run('run_1'))
    expect(generationStore.getTxState().runs.has('run_1')).toBe(true)
    generationStore.abortRun('run_1')
    expect(generationStore.getTxState().runs.has('run_1')).toBe(false)
  })

  it('finishRun(predecessor, successor) is atomic — no empty intermediate state', () => {
    generationStore.startRun(run('run_pred', 'per-turn'))
    generationStore.finishRun('run_pred', run('run_succ', 'chapter-close'))
    const runs = generationStore.getTxState().runs // synchronous read immediately after
    expect(runs.has('run_pred')).toBe(false)
    expect(runs.has('run_succ')).toBe(true)
    expect(runs.size).toBe(1)
  })
})
