import { beforeEach, describe, expect, it } from 'vitest'

import { diagnosticsStore } from './store'
import type { HttpCall, LogEntry, TurnCapture } from './types'

function entry(i: number): LogEntry {
  return { id: String(i), emittedAt: i, level: 'warn', kind: 'pipeline.recovered', fields: { i } }
}

describe('diagnosticsStore', () => {
  beforeEach(() => diagnosticsStore.getState().__reset())

  it('defaults to gate OFF and three empty slices', () => {
    const s = diagnosticsStore.getState()
    expect(s.enabled).toBe(false)
    expect(s.debugEnabled).toBe(false)
    expect(s.logEntries).toEqual([])
    expect(s.httpCalls).toEqual([])
    expect(s.turnCaptures).toEqual([])
  })

  it('evicts logEntries FIFO at cap 500', () => {
    for (let i = 0; i < 600; i++) diagnosticsStore.getState().pushLog(entry(i))
    const entries = diagnosticsStore.getState().logEntries
    expect(entries).toHaveLength(500)
    expect(entries[0].fields.i).toBe(100) // first 100 (0..99) evicted
    expect(entries[499].fields.i).toBe(599)
  })

  it('setEnabled(false) clears all three slices', () => {
    const s = diagnosticsStore.getState()
    s.setEnabled(true)
    s.pushLog(entry(1))
    diagnosticsStore.setState({
      httpCalls: [{ id: 'h' } as HttpCall],
      turnCaptures: [{ actionId: 't' } as TurnCapture],
    })
    diagnosticsStore.getState().setEnabled(false)
    const after = diagnosticsStore.getState()
    expect(after.enabled).toBe(false)
    expect(after.logEntries).toEqual([])
    expect(after.httpCalls).toEqual([])
    expect(after.turnCaptures).toEqual([])
  })
})
