import { describe, expect, it } from 'vitest'

import { characterRelationshipWriteSchema } from './character-relationship-schema'

describe('characterRelationshipWriteSchema', () => {
  it('accepts a non-empty kind and a null', () => {
    expect(
      characterRelationshipWriteSchema.pick({ kind: true }).safeParse({ kind: 'sister' }).success,
    ).toBe(true)
    expect(
      characterRelationshipWriteSchema.pick({ kind: true }).safeParse({ kind: null }).success,
    ).toBe(true)
  })

  it('rejects an empty-string kind', () => {
    expect(
      characterRelationshipWriteSchema.pick({ kind: true }).safeParse({ kind: '' }).success,
    ).toBe(false)
  })
})
