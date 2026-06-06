import { describe, expect, it } from 'vitest'

import { loreWriteSchema } from './lore-schema'

describe('loreWriteSchema', () => {
  it('parses a minimal lore row, applying defaults', () => {
    const parsed = loreWriteSchema.parse({ title: 'Magic system', injectionMode: 'auto' })
    expect(parsed).toMatchObject({
      title: 'Magic system',
      body: null,
      category: null,
      tags: [],
      keywords: [],
      injectionMode: 'auto',
      priority: 0,
    })
  })

  it('rejects a priority above 100', () => {
    expect(
      loreWriteSchema.safeParse({ title: 'X', injectionMode: 'auto', priority: 200 }).success,
    ).toBe(false)
  })

  it('rejects a negative priority', () => {
    expect(
      loreWriteSchema.safeParse({ title: 'X', injectionMode: 'auto', priority: -1 }).success,
    ).toBe(false)
  })

  it('rejects an unknown injection mode', () => {
    expect(loreWriteSchema.safeParse({ title: 'X', injectionMode: 'sometimes' }).success).toBe(
      false,
    )
  })
})
