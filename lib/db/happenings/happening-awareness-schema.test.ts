import { describe, expect, it } from 'vitest'

import { happeningAwarenessWriteSchema } from './happening-awareness-schema'

describe('happeningAwarenessWriteSchema', () => {
  it('accepts a decay_resistance within 0..1 and a null', () => {
    expect(
      happeningAwarenessWriteSchema.safeParse({
        happeningId: 'hap_1',
        characterId: 'char_1',
        decayResistance: 0.5,
      }).success,
    ).toBe(true)
    expect(
      happeningAwarenessWriteSchema.safeParse({
        happeningId: 'hap_1',
        characterId: 'char_1',
        decayResistance: null,
      }).success,
    ).toBe(true)
  })

  it('rejects a decay_resistance above 1', () => {
    expect(
      happeningAwarenessWriteSchema.safeParse({
        happeningId: 'hap_1',
        characterId: 'char_1',
        decayResistance: 1.5,
      }).success,
    ).toBe(false)
  })

  it('rejects a decay_resistance below 0', () => {
    expect(
      happeningAwarenessWriteSchema.safeParse({
        happeningId: 'hap_1',
        characterId: 'char_1',
        decayResistance: -0.1,
      }).success,
    ).toBe(false)
  })
})
