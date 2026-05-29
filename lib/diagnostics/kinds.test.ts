import { describe, expect, expectTypeOf, it } from 'vitest'

import { EVENT_NAME_REGEX, eventNameOf, type LogKind } from './kinds'

describe('kinds', () => {
  it('extracts the event-name half after the first dot', () => {
    expect(eventNameOf('pipeline.phase_failed')).toBe('phase_failed')
    expect(eventNameOf('provider.retry_succeeded')).toBe('retry_succeeded')
    expect(eventNameOf('nodot')).toBe('')
  })

  it('matches snake_case event names and rejects others', () => {
    expect(EVENT_NAME_REGEX.test('phase_failed')).toBe(true)
    expect(EVENT_NAME_REGEX.test('phaseFailed')).toBe(false)
    expect(EVENT_NAME_REGEX.test('Phase_failed')).toBe(false)
  })

  it('LogKind enforces the subsystem prefix at compile time', () => {
    expectTypeOf<'pipeline.phase_failed'>().toExtend<LogKind>()
    expectTypeOf<'provider.retry_succeeded'>().toExtend<LogKind>()
    // @ts-expect-error unknown subsystem prefix is not assignable to LogKind
    const bad: LogKind = 'unknown_subsystem.event'
    void bad
  })
})
