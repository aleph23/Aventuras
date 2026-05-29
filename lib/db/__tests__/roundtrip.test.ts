import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { appSettings, branches, pipelineRuns, stories, storyEntries } from '../schema'
import { createTestDb } from './test-db'

describe('roundtrip', () => {
  it('inserts and reads back every table with inferred types', async () => {
    const { db } = await createTestDb()

    await db.insert(stories).values({ id: 's1', title: 'Test', createdAt: 1, updatedAt: 1 })
    const [story] = await db.select().from(stories).where(eq(stories.id, 's1'))
    expect(story.title).toBe('Test')
    expect(story.tags).toEqual([])
    expect(story.status).toBe('draft')

    await db.insert(branches).values({ id: 'b1', storyId: 's1', name: 'main', createdAt: 1 })
    await db.insert(storyEntries).values({
      id: 'e1',
      branchId: 'b1',
      position: 1,
      kind: 'opening',
      content: 'Once upon a time',
      createdAt: 1,
    })
    const [entry] = await db.select().from(storyEntries).where(eq(storyEntries.id, 'e1'))
    expect(entry.kind).toBe('opening')
    expect(entry.branchId).toBe('b1')

    await db.insert(appSettings).values({ id: 'singleton' })
    const [settings] = await db.select().from(appSettings)
    expect(settings.diagnostics).toEqual({ enabled: false, debug_level_enabled: false })

    await db.insert(pipelineRuns).values({
      runId: 'r1',
      kind: 'narrative',
      actionId: 'a1',
      startedAt: 1,
    })
    const [run] = await db.select().from(pipelineRuns).where(eq(pipelineRuns.runId, 'r1'))
    expect(run.finishedAt).toBeNull()
    expect(run.outcome).toBeNull()
  })

  it('rejects a story_entry whose branch does not exist (FK on)', async () => {
    const { db } = await createTestDb()
    await expect(
      db.insert(storyEntries).values({
        id: 'x',
        branchId: 'missing',
        position: 1,
        kind: 'system',
        content: '',
        createdAt: 1,
      }),
    ).rejects.toThrow()
  })
})
