import { describe, expect, it } from 'vitest'

import { happeningWriteSchema } from './happening-schema'

describe('happeningWriteSchema', () => {
  it('rejects both occurred_at_entry_id and temporal set', () => {
    const r = happeningWriteSchema.safeParse({
      title: 'The duel',
      occurredAtEntryId: 'entry_1',
      temporal: 'long ago',
    })
    expect(r.success).toBe(false)
  })

  it('accepts either time field alone, and neither', () => {
    expect(
      happeningWriteSchema.safeParse({ title: 'a', occurredAtEntryId: 'entry_1' }).success,
    ).toBe(true)
    expect(happeningWriteSchema.safeParse({ title: 'b', temporal: 'dawn' }).success).toBe(true)
    expect(happeningWriteSchema.safeParse({ title: 'c' }).success).toBe(true)
  })

  it("normalizes '' on a ref field to null so it can't pass the DDL CHECK", () => {
    const r = happeningWriteSchema.safeParse({
      title: 'd',
      occurredAtEntryId: '',
      temporal: 'dusk',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.occurredAtEntryId).toBeNull()
  })

  it("normalizes '' on temporal to null", () => {
    const r = happeningWriteSchema.safeParse({
      title: 'f',
      occurredAtEntryId: 'entry_2',
      temporal: '',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.temporal).toBeNull()
  })

  it('rejects a commonKnowledge value outside 0|1', () => {
    expect(happeningWriteSchema.safeParse({ title: 'e', commonKnowledge: 2 }).success).toBe(false)
  })
})
