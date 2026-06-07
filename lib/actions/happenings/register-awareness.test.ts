import { and, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { branches, happeningAwareness, stories } from '@/lib/db'
import { createTestDb } from '@/lib/db/__tests__/test-db'
import { happeningAwarenessStore } from '@/lib/stores'

import { registerHappeningAwareness } from './register-awareness'
import { applyDeltaAction } from '../delta/apply-delta-action'
import { __resetRegistry } from '../delta/registry'
import { reverseReplayDeltas } from '../delta/reverse-replay'

async function setup() {
  __resetRegistry()
  registerHappeningAwareness()
  const { db, runInTransaction } = await createTestDb()
  await db.insert(stories).values({ id: 'story_1', title: 'T', createdAt: 1, updatedAt: 1 })
  await db.insert(branches).values({ id: 'br_1', storyId: 'story_1', name: 'main', createdAt: 1 })
  happeningAwarenessStore.__reset()
  happeningAwarenessStore.hydrate('br_1', [])
  return { db, ctx: { db, runInTransaction } }
}

async function awarenessRows(
  db: Awaited<ReturnType<typeof setup>>['db'],
  characterId: string,
  happeningId: string,
) {
  return db
    .select()
    .from(happeningAwareness)
    .where(
      and(
        eq(happeningAwareness.characterId, characterId),
        eq(happeningAwareness.happeningId, happeningId),
      ),
    )
}

describe('happening_awareness upsert', () => {
  it('first emit creates a row + delta + store patch', async () => {
    const { db, ctx } = await setup()
    await applyDeltaAction(
      {
        action: {
          kind: 'upsertHappeningAwareness',
          source: 'ai_classifier',
          payload: {
            branchId: 'br_1',
            characterId: 'char_a',
            happeningId: 'hap_1',
            learnedAtEntryId: 'entry_3',
            decayResistance: 0.2,
            source: 'overheard in tavern',
          },
        },
        actionId: 'act_1',
        branchId: 'br_1',
      },
      ctx,
    )
    const rows = await awarenessRows(db, 'char_a', 'hap_1')
    expect(rows.length).toBe(1)
    expect(rows[0].source).toBe('overheard in tavern')
    expect(rows[0].retrievalCount).toBe(0)
    expect(happeningAwarenessStore.getByCharacter('char_a').length).toBe(1)
  })

  it('re-emit merges into one row: overwrites source+decay, preserves learned_at + retrieval_count', async () => {
    const { db, ctx } = await setup()
    await applyDeltaAction(
      {
        action: {
          kind: 'upsertHappeningAwareness',
          source: 'ai_classifier',
          payload: {
            branchId: 'br_1',
            characterId: 'char_a',
            happeningId: 'hap_1',
            learnedAtEntryId: 'entry_3',
            decayResistance: 0.2,
            source: 'overheard',
          },
        },
        actionId: 'act_1',
        branchId: 'br_1',
      },
      ctx,
    )
    const [created] = await awarenessRows(db, 'char_a', 'hap_1')
    await ctx.runInTransaction([
      ctx.db
        .update(happeningAwareness)
        .set({ retrievalCount: 7 })
        .where(eq(happeningAwareness.id, created.id))
        .toSQL(),
    ])

    await applyDeltaAction(
      {
        action: {
          kind: 'upsertHappeningAwareness',
          source: 'ai_classifier',
          payload: {
            branchId: 'br_1',
            characterId: 'char_a',
            happeningId: 'hap_1',
            learnedAtEntryId: 'entry_9',
            decayResistance: 0.8,
            source: 'told by Jorin',
          },
        },
        actionId: 'act_2',
        branchId: 'br_1',
      },
      ctx,
    )
    const rows = await awarenessRows(db, 'char_a', 'hap_1')
    expect(rows.length).toBe(1)
    expect(rows[0].id).toBe(created.id)
    expect(rows[0].source).toBe('told by Jorin')
    expect(rows[0].decayResistance).toBe(0.8)
    expect(rows[0].learnedAtEntryId).toBe('entry_3')
    expect(rows[0].retrievalCount).toBe(7)

    expect(await reverseReplayDeltas('act_2', ctx)).toBe(1)
    const back = await awarenessRows(db, 'char_a', 'hap_1')
    expect(back[0].source).toBe('overheard')
    expect(back[0].decayResistance).toBe(0.2)
    expect(back[0].retrievalCount).toBe(7)
  })

  it('the DB UNIQUE backstops a duplicate natural key', async () => {
    const { ctx } = await setup()
    await applyDeltaAction(
      {
        action: {
          kind: 'upsertHappeningAwareness',
          source: 'ai_classifier',
          payload: { branchId: 'br_1', characterId: 'char_a', happeningId: 'hap_1', source: 's' },
        },
        actionId: 'act_1',
        branchId: 'br_1',
      },
      ctx,
    )
    await expect(
      ctx.runInTransaction([
        ctx.db
          .insert(happeningAwareness)
          .values({
            id: 'haw_dup',
            branchId: 'br_1',
            characterId: 'char_a',
            happeningId: 'hap_1',
            retrievalCount: 0,
          })
          .toSQL(),
      ]),
    ).rejects.toThrow()
  })

  it('delete; reverse-replay re-inserts with original id', async () => {
    const { db, ctx } = await setup()
    await applyDeltaAction(
      {
        action: {
          kind: 'upsertHappeningAwareness',
          source: 'ai_classifier',
          payload: { branchId: 'br_1', characterId: 'char_a', happeningId: 'hap_1', source: 's' },
        },
        actionId: 'act_1',
        branchId: 'br_1',
      },
      ctx,
    )
    const [created] = await awarenessRows(db, 'char_a', 'hap_1')
    await applyDeltaAction(
      {
        action: {
          kind: 'deleteHappeningAwareness',
          source: 'user_edit',
          payload: { branchId: 'br_1', id: created.id },
        },
        actionId: 'act_d',
        branchId: 'br_1',
      },
      ctx,
    )
    expect((await awarenessRows(db, 'char_a', 'hap_1')).length).toBe(0)
    expect(await reverseReplayDeltas('act_d', ctx)).toBe(1)
    const back = await awarenessRows(db, 'char_a', 'hap_1')
    expect(back[0].id).toBe(created.id)
    expect(happeningAwarenessStore.getById(created.id)?.source).toBe('s')
  })

  it('reverse-replay of the create deletes the row + prunes the store', async () => {
    const { db, ctx } = await setup()
    await applyDeltaAction(
      {
        action: {
          kind: 'upsertHappeningAwareness',
          source: 'ai_classifier',
          payload: { branchId: 'br_1', characterId: 'char_a', happeningId: 'hap_1', source: 's' },
        },
        actionId: 'act_1',
        branchId: 'br_1',
      },
      ctx,
    )
    const [created] = await awarenessRows(db, 'char_a', 'hap_1')
    expect(happeningAwarenessStore.getById(created.id)?.source).toBe('s')
    expect(await reverseReplayDeltas('act_1', ctx)).toBe(1)
    expect((await awarenessRows(db, 'char_a', 'hap_1')).length).toBe(0)
    expect(happeningAwarenessStore.getById(created.id)).toBeUndefined()
  })

  it('collapses an empty learned-at ref to NULL on create', async () => {
    const { db, ctx } = await setup()
    await applyDeltaAction(
      {
        action: {
          kind: 'upsertHappeningAwareness',
          source: 'user_edit',
          payload: {
            branchId: 'br_1',
            characterId: 'char_a',
            happeningId: 'hap_1',
            learnedAtEntryId: '',
            source: 's',
          },
        },
        actionId: 'act_1',
        branchId: 'br_1',
      },
      ctx,
    )
    const rows = await awarenessRows(db, 'char_a', 'hap_1')
    expect(rows[0].learnedAtEntryId).toBeNull()
  })

  it('create is allowed with no authored fields (awareness-only record)', async () => {
    const { db, ctx } = await setup()
    const res = await applyDeltaAction(
      {
        action: {
          kind: 'upsertHappeningAwareness',
          source: 'ai_classifier',
          payload: { branchId: 'br_1', characterId: 'char_a', happeningId: 'hap_1' },
        },
        actionId: 'act_1',
        branchId: 'br_1',
      },
      ctx,
    )
    expect(res.status).toBe('ok')
    const rows = await awarenessRows(db, 'char_a', 'hap_1')
    expect(rows.length).toBe(1)
    expect(rows[0].source).toBeNull()
  })
})
