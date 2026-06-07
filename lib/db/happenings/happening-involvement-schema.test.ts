import { describe, expect, it } from 'vitest'

import { happeningInvolvementWriteSchema } from './happening-involvement-schema'

describe('happeningInvolvementWriteSchema', () => {
  it('requires happeningId + entityId, allows null role', () => {
    expect(
      happeningInvolvementWriteSchema.safeParse({
        happeningId: 'hap_1',
        entityId: 'char_1',
        role: null,
      }).success,
    ).toBe(true)
  })

  it('rejects a missing entityId', () => {
    expect(happeningInvolvementWriteSchema.safeParse({ happeningId: 'hap_1' }).success).toBe(false)
  })
})
