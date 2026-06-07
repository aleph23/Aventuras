import { describe, expect, it } from 'vitest'

import type { HappeningInvolvement } from '@/lib/db'

import { happeningInvolvementsStore } from './involvements'

function row(id: string, happeningId: string, entityId: string): HappeningInvolvement {
  return { id, branchId: 'br_1', happeningId, entityId, role: null }
}

describe('happeningInvolvementsStore', () => {
  it('hydrates and filters by happening', () => {
    happeningInvolvementsStore.__reset()
    happeningInvolvementsStore.hydrate('br_1', [
      row('hinv_1', 'hap_1', 'char_1'),
      row('hinv_2', 'hap_1', 'loc_1'),
      row('hinv_3', 'hap_2', 'char_1'),
    ])
    expect(happeningInvolvementsStore.getByHappening('hap_1').length).toBe(2)
    expect(happeningInvolvementsStore.getById('hinv_3')?.entityId).toBe('char_1')
  })

  it('no-ops a patch for a non-held branch', () => {
    happeningInvolvementsStore.__reset()
    happeningInvolvementsStore.hydrate('br_1', [])
    happeningInvolvementsStore.patch('br_2', {
      op: 'create',
      id: 'hinv_9',
      row: row('hinv_9', 'hap_9', 'char_9'),
    })
    expect(happeningInvolvementsStore.getById('hinv_9')).toBeUndefined()
  })
})
