import { describe, expect, it } from 'vitest'

import type { HappeningAwareness } from '@/lib/db'

import { happeningAwarenessStore } from './awareness'

function row(id: string, happeningId: string, characterId: string): HappeningAwareness {
  return {
    id,
    branchId: 'br_1',
    happeningId,
    characterId,
    learnedAtEntryId: null,
    decayResistance: null,
    retrievalCount: 0,
    source: null,
  }
}

describe('happeningAwarenessStore', () => {
  it('filters by happening and by character', () => {
    happeningAwarenessStore.__reset()
    happeningAwarenessStore.hydrate('br_1', [
      row('haw_1', 'hap_1', 'char_a'),
      row('haw_2', 'hap_1', 'char_b'),
      row('haw_3', 'hap_2', 'char_a'),
    ])
    expect(happeningAwarenessStore.getByHappening('hap_1').length).toBe(2)
    expect(happeningAwarenessStore.getByCharacter('char_a').length).toBe(2)
  })

  it('no-ops a patch for a non-held branch', () => {
    happeningAwarenessStore.__reset()
    happeningAwarenessStore.hydrate('br_1', [])
    happeningAwarenessStore.patch('br_2', {
      op: 'create',
      id: 'haw_9',
      row: row('haw_9', 'hap_9', 'char_z'),
    })
    expect(happeningAwarenessStore.getById('haw_9')).toBeUndefined()
  })
})
