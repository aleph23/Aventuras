import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { awaitRunTerminal, definePipeline, runPipeline, type PhaseResult } from '@/lib/pipeline'
import { domain } from '@/lib/stores'

import { expectRan, makeHarness, resetSingletons } from './harness'

const base = { affordance: 'invisible', gateBehavior: 'no-gate' } as const

describe('runPipeline concurrency entry + coordination', () => {
  beforeEach(() => resetSingletons())
  afterEach(() => resetSingletons())

  it('rejects a start blocked by an in-flight run of a blocking kind', async () => {
    const { ctx } = await makeHarness()
    let release!: () => void
    const gate = new Promise<void>((r) => {
      release = r
    })
    async function* waits(): AsyncGenerator<never, PhaseResult> {
      await gate
      return { status: 'completed' }
    }
    definePipeline({
      kind: 'solo',
      phases: [{ name: 'p', run: waits }],
      concurrencyPolicy: { blockedBy: ['solo'] },
      ...base,
    })

    const inflight = runPipeline('solo', ctx) // sync-reserves 'solo', then hangs on the gate
    const blocked = await runPipeline('solo', ctx)
    expect(blocked).toEqual({ outcome: 'rejected', blockedBy: 'solo' })

    release()
    expect(expectRan(await inflight).outcome).toBe('completed')
  })

  it('awaitRunTerminal(cancel) aborts the in-flight run and resolves on its terminal', async () => {
    const { ctx } = await makeHarness()
    async function* waits(): AsyncGenerator<never, PhaseResult> {
      const { abortSignal } = domain.getPerTurnContext()
      await new Promise<void>((resolve) => {
        if (abortSignal.aborted) resolve()
        else abortSignal.addEventListener('abort', () => resolve(), { once: true })
      })
      return { status: abortSignal.aborted ? 'aborted' : 'completed' }
    }
    definePipeline({
      kind: 'bg',
      phases: [{ name: 'p', run: waits }],
      concurrencyPolicy: {},
      ...base,
    })

    const inflight = runPipeline('bg', ctx)
    await awaitRunTerminal('bg', 'cancel')
    expect(expectRan(await inflight).outcome).toBe('aborted')
    expect(domain.getTxState().runs.size).toBe(0)
  })

  it('awaitRunTerminal(finish) awaits the natural commit without aborting', async () => {
    const { ctx } = await makeHarness()
    let release!: () => void
    const gate = new Promise<void>((r) => {
      release = r
    })
    async function* waits(): AsyncGenerator<never, PhaseResult> {
      await gate
      return { status: 'completed' }
    }
    definePipeline({
      kind: 'bg',
      phases: [{ name: 'p', run: waits }],
      concurrencyPolicy: {},
      ...base,
    })

    const inflight = runPipeline('bg', ctx)
    let resolved = false
    const waiter = awaitRunTerminal('bg', 'finish').then(() => {
      resolved = true
    })
    await Promise.resolve()
    expect(resolved).toBe(false) // still running — finish does not abort
    release()
    await waiter
    expect(resolved).toBe(true)
    expect(expectRan(await inflight).outcome).toBe('completed')
  })

  it('awaitRunTerminal no-ops when no run of the kind is in flight', async () => {
    await expect(awaitRunTerminal('absent', 'cancel')).resolves.toBeUndefined()
  })

  it('start-after-yields aborts the yielding run before starting the incoming one', async () => {
    const { ctx } = await makeHarness()
    // bg only ends by abort; pre-check aborted so a yield that fires before the
    // phase registers its listener isn't missed.
    async function* bgPhase(): AsyncGenerator<never, PhaseResult> {
      const { abortSignal } = domain.getPerTurnContext()
      await new Promise<void>((resolve) => {
        if (abortSignal.aborted) resolve()
        else abortSignal.addEventListener('abort', () => resolve(), { once: true })
      })
      return { status: abortSignal.aborted ? 'aborted' : 'completed' }
    }
    async function* fgPhase(): AsyncGenerator<never, PhaseResult> {
      return { status: 'completed' }
    }
    definePipeline({
      kind: 'bg',
      phases: [{ name: 'p', run: bgPhase }],
      concurrencyPolicy: { yieldsTo: ['fg'] },
      ...base,
    })
    definePipeline({
      kind: 'fg',
      phases: [{ name: 'p', run: fgPhase }],
      concurrencyPolicy: {},
      ...base,
    })

    const bg = runPipeline('bg', ctx)
    const fg = expectRan(await runPipeline('fg', ctx))
    expect(fg.outcome).toBe('completed')
    expect((await bg).outcome).toBe('aborted') // bg was yielded (aborted) before fg started
  })

  it('start-after-yields re-checks after the wait: a blocker that slips in rejects the start', async () => {
    const { ctx } = await makeHarness()
    let releaseBlocker!: () => void
    const blockerGate = new Promise<void>((r) => {
      releaseBlocker = r
    })
    let blockerInflight: Promise<unknown> | undefined

    async function* blockerPhase(): AsyncGenerator<never, PhaseResult> {
      await blockerGate
      return { status: 'completed' }
    }
    // While fg awaits bg's terminal (the yield), bg slips a 'blocker' run into
    // txState — a kind fg.blockedBy lists. A stale entry path reserves fg anyway;
    // a correct one re-checks after the wait and rejects it.
    async function* bgPhase(): AsyncGenerator<never, PhaseResult> {
      const { abortSignal } = domain.getPerTurnContext()
      await new Promise<void>((resolve) => {
        if (abortSignal.aborted) resolve()
        else abortSignal.addEventListener('abort', () => resolve(), { once: true })
      })
      blockerInflight = runPipeline('blocker', ctx)
      return { status: 'aborted' }
    }
    async function* fgPhase(): AsyncGenerator<never, PhaseResult> {
      return { status: 'completed' }
    }
    definePipeline({
      kind: 'blocker',
      phases: [{ name: 'p', run: blockerPhase }],
      concurrencyPolicy: {},
      ...base,
    })
    definePipeline({
      kind: 'bg',
      phases: [{ name: 'p', run: bgPhase }],
      concurrencyPolicy: { yieldsTo: ['fg'] },
      ...base,
    })
    definePipeline({
      kind: 'fg',
      phases: [{ name: 'p', run: fgPhase }],
      concurrencyPolicy: { blockedBy: ['blocker'] },
      ...base,
    })

    const bg = runPipeline('bg', ctx)
    const fg = await runPipeline('fg', ctx)
    expect(fg).toEqual({ outcome: 'rejected', blockedBy: 'blocker' })
    expect((await bg).outcome).toBe('aborted')

    releaseBlocker()
    await blockerInflight
  })
})
