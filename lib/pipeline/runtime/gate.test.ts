import { afterEach, describe, expect, it } from 'vitest'

import type { RunState, TxState } from '@/lib/stores'

import { isUserEditBlocked } from './gate'
import { definePipeline } from '../authoring/define'
import { __resetRegistry } from '../authoring/registry'
import type { PhaseResult } from '../types'

afterEach(() => __resetRegistry())

async function* ok(): AsyncGenerator<never, PhaseResult> {
  return { status: 'completed' }
}

const base = { affordance: 'invisible', concurrencyPolicy: {} } as const

function run(kind: string): RunState {
  return {
    runId: `r_${kind}`,
    kind,
    actionId: 'a',
    storyId: null,
    branchId: 'b',
    abortController: new AbortController(),
    currentPhase: '',
    intermediates: {},
    terminal: Promise.resolve(),
    resolveTerminal: () => {},
  }
}

const tx = (kinds: string[], reversalInProgress = false): TxState => ({
  runs: new Map(kinds.map((k) => [run(k).runId, run(k)])),
  reversalInProgress,
})

describe('isUserEditBlocked', () => {
  it('blocks only when a hard-gate run is in flight', () => {
    definePipeline({
      kind: 'fg',
      phases: [{ name: 'p', run: ok }],
      gateBehavior: 'hard-gate',
      ...base,
    })
    definePipeline({
      kind: 'bg',
      phases: [{ name: 'p', run: ok }],
      gateBehavior: 'no-gate',
      ...base,
    })
    expect(isUserEditBlocked(tx([]))).toBe(false)
    expect(isUserEditBlocked(tx(['bg']))).toBe(false)
    expect(isUserEditBlocked(tx(['bg', 'fg']))).toBe(true)
  })

  it('blocks while a reversal is in progress, even with no hard-gate run', () => {
    expect(isUserEditBlocked(tx([], true))).toBe(true)
  })
})
