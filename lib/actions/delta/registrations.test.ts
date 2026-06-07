import { describe, expect, it } from 'vitest'

import { resolveByActionKind, resolveByTable } from './registry'

describe('registerAllDomains', () => {
  it('registers story_entries handlers + descriptor', () => {
    expect(resolveByActionKind('createStoryEntry')).toBeDefined()
    expect(resolveByActionKind('updateStoryEntryMetadata')).toBeDefined()
    expect(resolveByTable('story_entries')?.table).toBe('story_entries')
  })

  it('registers the happenings cluster + character relationships', () => {
    expect(resolveByActionKind('createHappening')).toBeDefined()
    expect(resolveByActionKind('updateHappening')).toBeDefined()
    expect(resolveByActionKind('deleteHappening')).toBeDefined()
    expect(resolveByActionKind('createHappeningInvolvement')).toBeDefined()
    expect(resolveByActionKind('upsertHappeningAwareness')).toBeDefined()
    expect(resolveByActionKind('upsertCharacterRelationship')).toBeDefined()
    expect(resolveByTable('happenings')?.table).toBe('happenings')
    expect(resolveByTable('happening_involvements')?.table).toBe('happening_involvements')
    expect(resolveByTable('happening_awareness')?.table).toBe('happening_awareness')
    expect(resolveByTable('character_relationships')?.table).toBe('character_relationships')
  })
})
