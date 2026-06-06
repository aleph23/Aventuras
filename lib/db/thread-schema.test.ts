import { describe, expect, it } from 'vitest'

import { threadWriteSchema } from './thread-schema'

describe('threadWriteSchema', () => {
  it('parses a minimal thread row, applying defaults', () => {
    const parsed = threadWriteSchema.parse({
      title: 'Find the sword',
      status: 'active',
      injectionMode: 'auto',
    })
    expect(parsed).toMatchObject({
      title: 'Find the sword',
      description: null,
      category: null,
      icon: null,
      status: 'active',
      injectionMode: 'auto',
      triggeredAtEntryId: null,
      resolvedAtEntryId: null,
    })
  })

  it('rejects an unknown status', () => {
    expect(
      threadWriteSchema.safeParse({ title: 'X', status: 'abandoned', injectionMode: 'auto' })
        .success,
    ).toBe(false)
  })

  it('rejects an unknown injection mode', () => {
    expect(
      threadWriteSchema.safeParse({ title: 'X', status: 'pending', injectionMode: 'sometimes' })
        .success,
    ).toBe(false)
  })
})
